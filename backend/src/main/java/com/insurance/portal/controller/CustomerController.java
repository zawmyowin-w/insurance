package com.insurance.portal.controller;

import com.insurance.portal.dto.*;
import com.insurance.portal.model.*;
import com.insurance.portal.model.enums.*;
import com.insurance.portal.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/customer")
@RequiredArgsConstructor
public class CustomerController {

    private final UserRepository userRepo;
    private final InsurancePackageRepository packageRepo;
    private final PolicyApplicationRepository appRepo;
    private final ClaimRepository claimRepo;
    private final PaymentRepository paymentRepo;
    private final NotificationRepository notifRepo;

    private User getUser(UserDetails principal) {
        return userRepo.findByEmail(principal.getUsername()).orElseThrow();
    }

    // ── Dashboard Stats ──────────────────────────────────────────────
    @GetMapping("/dashboard/stats")
    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats(@AuthenticationPrincipal UserDetails principal) {
        User user = getUser(principal);
        Map<String, Object> stats = new HashMap<>();
        stats.put("applications", appRepo.countByCustomer(user));
        stats.put("activePolicies", appRepo.countByCustomerAndStatus(user, ApplicationStatus.APPROVED));
        stats.put("pendingClaims", claimRepo.countByCustomerAndStatus(user, ClaimStatus.PENDING));
        stats.put("notifications", notifRepo.countByRecipientAndReadFalse(user));
        return stats;
    }

    // ── Applications ─────────────────────────────────────────────────
    @GetMapping("/applications")
    @Transactional(readOnly = true)
    public List<ApplicationResponse> getApplications(@AuthenticationPrincipal UserDetails principal,
                                                      @RequestParam(required = false) String status) {
        User user = getUser(principal);
        List<PolicyApplication> apps;
        if (status != null && !status.isEmpty()) {
            try { apps = appRepo.findAllByCustomerAndStatus(user, ApplicationStatus.valueOf(status)); }
            catch (Exception e) { apps = appRepo.findAllByCustomer(user); }
        } else {
            apps = appRepo.findAllByCustomer(user);
        }
        return apps.stream().sorted(Comparator.comparing(PolicyApplication::getCreatedAt).reversed())
                .map(ApplicationResponse::from).toList();
    }

    @PostMapping("/applications")
    @Transactional
    public ResponseEntity<?> submitApplication(@AuthenticationPrincipal UserDetails principal,
                                               @RequestBody Map<String, Object> req) {
        User user = getUser(principal);
        Long pkgId = Long.valueOf(req.get("packageId").toString());
        InsurancePackage pkg = packageRepo.findById(pkgId)
                .orElseThrow(() -> new RuntimeException("Package not found"));
        if (!pkg.isActive()) return ResponseEntity.badRequest().body(Map.of("message", "This package is no longer available"));

        BigDecimal coverageAmount = new BigDecimal(req.get("coverageAmount").toString());
        int duration = Integer.parseInt(req.get("duration").toString());

        // commonInfo / extraInfo arrive as JSON strings from the frontend
        String commonInfoJson = req.containsKey("commonInfo") && req.get("commonInfo") != null
                ? serializeToJson(req.get("commonInfo")) : null;
        String extraInfoJson = req.containsKey("extraInfo") && req.get("extraInfo") != null
                ? serializeToJson(req.get("extraInfo")) : null;

        // Calculate risk and premium
        String riskLevel = calculateRisk(pkg.getType(), commonInfoJson, extraInfoJson);
        BigDecimal premiumAmount = calculatePremium(coverageAmount, pkg.getPremiumRate(), duration, riskLevel);
        String policyNumber = generatePolicyNumber(pkg.getType());

        // Assign first available agent matching insurance type
        List<User> agents = userRepo.findAllByRoleAndActive(Role.AGENT, true);
        User agent = agents.stream()
                .filter(a -> a.getInsuranceType() == null
                        || "ALL".equals(a.getInsuranceType())
                        || a.getInsuranceType().equals(pkg.getType()))
                .findFirst().orElse(agents.isEmpty() ? null : agents.get(0));

        PolicyApplication app = PolicyApplication.builder()
                .customer(user)
                .insurancePackage(pkg)
                .agent(agent)
                .coverageAmount(coverageAmount)
                .duration(duration)
                .notes(req.containsKey("notes") ? req.get("notes").toString() : null)
                .commonInfo(commonInfoJson)
                .extraInfo(extraInfoJson)
                .riskLevel(riskLevel)
                .premiumAmount(premiumAmount)
                .policyNumber(policyNumber)
                .status(ApplicationStatus.PENDING)
                .build();
        return ResponseEntity.ok(ApplicationResponse.from(appRepo.save(app)));
    }

    @DeleteMapping("/applications/{id}")
    @Transactional
    public ResponseEntity<?> cancelApplication(@PathVariable Long id,
                                               @AuthenticationPrincipal UserDetails principal) {
        User user = getUser(principal);
        PolicyApplication app = appRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        // Ownership check
        if (!app.getCustomer().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
        }
        if (app.getStatus() != ApplicationStatus.PENDING) {
            return ResponseEntity.badRequest().body(Map.of("message", "Only PENDING applications can be cancelled"));
        }
        app.setStatus(ApplicationStatus.CANCELLED);
        appRepo.save(app);
        return ResponseEntity.ok(Map.of("message", "Application cancelled"));
    }

    // ── Claims ───────────────────────────────────────────────────────
    @GetMapping("/claims")
    @Transactional(readOnly = true)
    public List<ClaimResponse> getClaims(@AuthenticationPrincipal UserDetails principal) {
        User user = getUser(principal);
        return claimRepo.findAllByCustomer(user).stream()
                .sorted(Comparator.comparing(Claim::getCreatedAt).reversed())
                .map(ClaimResponse::from).toList();
    }

    @PostMapping("/claims")
    @Transactional
    public ResponseEntity<?> submitClaim(@AuthenticationPrincipal UserDetails principal,
                                         @RequestParam String applicationId,
                                         @RequestParam String claimType,
                                         @RequestParam String amount,
                                         @RequestParam String description,
                                         @RequestParam String incidentDate,
                                         @RequestParam(required = false) List<MultipartFile> documents) {
        User user = getUser(principal);
        PolicyApplication app = appRepo.findById(Long.valueOf(applicationId))
                .orElseThrow(() -> new RuntimeException("Application not found"));
        // Ownership check - claim must be for own approved application
        if (!app.getCustomer().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "This application does not belong to you"));
        }
        if (app.getStatus() != ApplicationStatus.APPROVED) {
            return ResponseEntity.badRequest().body(Map.of("message", "Claims can only be submitted for APPROVED policies"));
        }
        Claim claim = Claim.builder()
                .application(app)
                .customer(user)
                .agent(app.getAgent())
                .claimType(claimType)
                .amount(new BigDecimal(amount))
                .description(description)
                .incidentDate(LocalDate.parse(incidentDate))
                .status(ClaimStatus.PENDING)
                .build();
        return ResponseEntity.ok(ClaimResponse.from(claimRepo.save(claim)));
    }

    // ── Payments ─────────────────────────────────────────────────────
    @GetMapping("/payments")
    @Transactional(readOnly = true)
    public List<?> getPayments(@AuthenticationPrincipal UserDetails principal) {
        User user = getUser(principal);
        return paymentRepo.findAllByCustomer(user).stream()
                .sorted(Comparator.comparing(Payment::getCreatedAt).reversed())
                .map(p -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", p.getId());
                    m.put("policyName", p.getApplication() != null
                            && p.getApplication().getInsurancePackage() != null
                            ? p.getApplication().getInsurancePackage().getName() : "");
                    m.put("amount", p.getAmount());
                    m.put("paymentType", p.getPaymentType());
                    m.put("status", p.getStatus().name());
                    m.put("verifiedBy", p.getVerifiedBy());
                    m.put("createdAt", p.getCreatedAt());
                    return m;
                }).toList();
    }

    @PostMapping("/payments")
    @Transactional
    public ResponseEntity<?> submitPayment(@AuthenticationPrincipal UserDetails principal,
                                           @RequestParam String applicationId,
                                           @RequestParam(required = false) MultipartFile screenshot,
                                           @RequestParam(required = false) String notes) {
        User user = getUser(principal);
        PolicyApplication app = appRepo.findById(Long.valueOf(applicationId))
                .orElseThrow(() -> new RuntimeException("Application not found"));
        // Ownership check
        if (!app.getCustomer().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "This application does not belong to you"));
        }
        if (app.getStatus() != ApplicationStatus.APPROVED) {
            return ResponseEntity.badRequest().body(Map.of("message", "Payment can only be submitted for APPROVED applications"));
        }
        // Check if pending payment already exists
        if (paymentRepo.existsByApplication_IdAndStatus(app.getId(), PaymentStatus.PENDING)) {
            return ResponseEntity.badRequest().body(Map.of("message", "A pending payment already exists for this application"));
        }

        String screenshotPath = null;
        if (screenshot != null && !screenshot.isEmpty()) {
            try {
                // Validate content type — only allow common image formats
                String contentType = screenshot.getContentType();
                String ext = switch (contentType != null ? contentType.toLowerCase() : "") {
                    case "image/jpeg" -> ".jpg";
                    case "image/png"  -> ".png";
                    case "image/webp" -> ".webp";
                    case "image/gif"  -> ".gif";
                    default -> throw new RuntimeException("Unsupported file type. Only JPEG, PNG, WEBP, and GIF are allowed.");
                };
                // Ignore client filename — generate server-side UUID name to prevent path traversal
                String safeFilename = "payment_" + java.util.UUID.randomUUID() + ext;
                File uploadRoot = new File("./uploads/payments").getCanonicalFile();
                uploadRoot.mkdirs();
                File dest = new File(uploadRoot, safeFilename).getCanonicalFile();
                // Verify resolved path stays within upload root (path traversal guard)
                if (!dest.getPath().startsWith(uploadRoot.getPath())) {
                    throw new RuntimeException("Invalid upload path");
                }
                screenshot.transferTo(dest);
                screenshotPath = dest.getPath();
            } catch (RuntimeException e) {
                return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("message", "Failed to save screenshot"));
            }
        }

        Payment payment = Payment.builder()
                .application(app)
                .customer(user)
                .paymentType("PREMIUM")
                .screenshotPath(screenshotPath)
                .notes(notes)
                .status(PaymentStatus.PENDING)
                .build();
        Payment saved = paymentRepo.save(payment);
        // Return a safe map — never return JPA entity directly (risks recursive serialization)
        return ResponseEntity.ok(Map.of(
                "id", saved.getId(),
                "status", saved.getStatus().name(),
                "paymentType", saved.getPaymentType(),
                "createdAt", saved.getCreatedAt()
        ));
    }

    // ── Active Policies (APPROVED applications) ─────────────────────
    @GetMapping("/policies")
    @Transactional(readOnly = true)
    public List<?> getActivePolicies(@AuthenticationPrincipal UserDetails principal) {
        User user = getUser(principal);
        return appRepo.findAllByCustomerAndStatus(user, ApplicationStatus.APPROVED).stream()
                .sorted(Comparator.comparing(PolicyApplication::getCreatedAt).reversed())
                .map(app -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", app.getId());
                    m.put("policyNumber", app.getPolicyNumber());
                    m.put("packageName", app.getInsurancePackage() != null ? app.getInsurancePackage().getName() : null);
                    m.put("packageType", app.getInsurancePackage() != null ? app.getInsurancePackage().getType() : null);
                    m.put("coverageAmount", app.getCoverageAmount());
                    m.put("premiumAmount", app.getPremiumAmount());
                    m.put("duration", app.getDuration());
                    m.put("riskLevel", app.getRiskLevel());
                    m.put("status", app.getStatus().name());
                    m.put("createdAt", app.getCreatedAt());
                    m.put("agentName", app.getAgent() != null ? app.getAgent().getName() : null);
                    return m;
                }).toList();
    }

    // Renew an existing active policy
    @PostMapping("/applications/{id}/renew")
    @Transactional
    public ResponseEntity<?> renewPolicy(@PathVariable Long id,
                                         @AuthenticationPrincipal UserDetails principal) {
        User user = getUser(principal);
        PolicyApplication original = appRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Policy not found"));
        if (!original.getCustomer().getId().equals(user.getId()))
            return ResponseEntity.status(403).body(Map.of("message", "Forbidden"));
        if (original.getStatus() != ApplicationStatus.APPROVED)
            return ResponseEntity.badRequest().body(Map.of("message", "Only active policies can be renewed"));
        String newPolicyNumber = original.getInsurancePackage() != null
                ? generatePolicyNumber(original.getInsurancePackage().getType()) : generatePolicyNumber("POL");
        PolicyApplication renewal = PolicyApplication.builder()
                .customer(user)
                .insurancePackage(original.getInsurancePackage())
                .agent(original.getAgent())
                .coverageAmount(original.getCoverageAmount())
                .duration(original.getDuration())
                .notes("Renewal of policy " + original.getPolicyNumber())
                .commonInfo(original.getCommonInfo())
                .extraInfo(original.getExtraInfo())
                .riskLevel(original.getRiskLevel())
                .premiumAmount(original.getPremiumAmount())
                .policyNumber(newPolicyNumber)
                .status(ApplicationStatus.PENDING)
                .build();
        return ResponseEntity.ok(ApplicationResponse.from(appRepo.save(renewal)));
    }

    // ── Notifications ────────────────────────────────────────────────
    @GetMapping("/notifications")
    @Transactional(readOnly = true)
    public List<?> getNotifications(@AuthenticationPrincipal UserDetails principal) {
        User user = getUser(principal);
        return notifRepo.findAllByRecipientOrderByCreatedAtDesc(user).stream().map(n -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", n.getId());
            m.put("title", n.getTitle());
            m.put("message", n.getMessage());
            m.put("type", n.getType().name());
            m.put("read", n.isRead());
            m.put("createdAt", n.getCreatedAt());
            return m;
        }).toList();
    }

    // ── Helper methods ───────────────────────────────────────────────
    private String serializeToJson(Object obj) {
        if (obj instanceof String) return (String) obj; // already a JSON string
        try { return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(obj); }
        catch (Exception e) { return obj.toString(); }
    }

    private String calculateRisk(String type, String commonInfoJson, String extraInfoJson) {
        int score = 0;
        try {
            if (commonInfoJson != null) {
                java.util.regex.Matcher m = java.util.regex.Pattern.compile("\"dob\"\\s*:\\s*\"(\\d{4})-").matcher(commonInfoJson);
                if (m.find()) {
                    int age = java.time.Year.now().getValue() - Integer.parseInt(m.group(1));
                    if (age > 55) score += 3;
                    else if (age > 40) score += 1;
                }
            }
            if (extraInfoJson != null) {
                if ("LIFE".equals(type)) {
                    if (extraInfoJson.contains("\"smoking\":true")) score += 2;
                    if (extraInfoJson.contains("\"hasDisease\":true")) score += 2;
                }
                if ("HEALTH".equals(type) && extraInfoJson.contains("\"existingDiseases\"")
                        && !extraInfoJson.contains("\"existingDiseases\":\"\"")
                        && !extraInfoJson.contains("\"existingDiseases\":null")) score += 2;
                if ("MOTOR".equals(type) || "VEHICLE".equals(type)) {
                    java.util.regex.Matcher m = java.util.regex.Pattern.compile("\"vehicleYear\"\\s*:\\s*\"?(\\d{4})").matcher(extraInfoJson);
                    if (m.find()) {
                        int vehicleAge = java.time.Year.now().getValue() - Integer.parseInt(m.group(1));
                        if (vehicleAge > 10) score += 3;
                        else if (vehicleAge > 5) score += 1;
                    }
                }
            }
        } catch (Exception ignored) {}
        return score <= 1 ? "LOW" : score <= 3 ? "MEDIUM" : "HIGH";
    }

    private BigDecimal calculatePremium(BigDecimal coverage, BigDecimal rate, int duration, String risk) {
        double multiplier = "HIGH".equals(risk) ? 1.5 : "MEDIUM".equals(risk) ? 1.2 : 1.0;
        if (rate == null) return BigDecimal.ZERO;
        return coverage.multiply(rate).multiply(BigDecimal.valueOf(duration)).multiply(BigDecimal.valueOf(multiplier)).setScale(2, java.math.RoundingMode.HALF_UP);
    }

    private String generatePolicyNumber(String type) {
        String prefix = (type != null && type.length() >= 3) ? type.substring(0, 3).toUpperCase() : "INS";
        int year = java.time.Year.now().getValue();
        int rand = (int) (Math.random() * 900000) + 100000;
        return String.format("POL-%s-%d-%06d", prefix, year, rand);
    }
}
