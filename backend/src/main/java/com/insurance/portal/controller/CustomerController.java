package com.insurance.portal.controller;

import com.insurance.portal.dto.*;
import com.insurance.portal.model.*;
import com.insurance.portal.model.enums.*;
import com.insurance.portal.repository.*;
import com.insurance.portal.util.FileStorageUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    @PostMapping(value = "/applications", consumes = {"multipart/form-data"})
    @Transactional
    public ResponseEntity<?> submitApplication(@AuthenticationPrincipal UserDetails principal,
                                               @RequestParam String packageId,
                                               @RequestParam String coverageAmount,
                                               @RequestParam String duration,
                                               @RequestParam(required = false) String notes,
                                               @RequestParam(required = false) String commonInfo,
                                               @RequestParam(required = false) String extraInfo,
                                               @RequestParam(required = false) List<MultipartFile> documents) {
        User user = getUser(principal);
        Long pkgId = Long.valueOf(packageId);
        InsurancePackage pkg = packageRepo.findById(pkgId)
                .orElseThrow(() -> new RuntimeException("Package not found"));
        if (!pkg.isActive()) return ResponseEntity.badRequest().body(Map.of("message", "This package is no longer available"));

        BigDecimal coverage = new BigDecimal(coverageAmount);
        int dur = Integer.parseInt(duration);

        // Calculate risk and premium
        String riskLevel = calculateRisk(pkg.getType(), commonInfo, extraInfo);
        BigDecimal premiumAmount = calculatePremium(coverage, pkg.getPremiumRate(), dur, riskLevel);
        String policyNumber = generatePolicyNumber(pkg.getType());

        // Assign first available agent matching insurance type
        List<User> agents = userRepo.findAllByRoleAndActive(Role.AGENT, true);
        User agent = agents.stream()
                .filter(a -> a.getInsuranceType() == null
                        || "ALL".equals(a.getInsuranceType())
                        || a.getInsuranceType().equals(pkg.getType()))
                .findFirst().orElse(agents.isEmpty() ? null : agents.get(0));

        String documentsJson;
        try {
            documentsJson = FileStorageUtil.toJsonArray(FileStorageUtil.saveDocuments(documents, "applications", "app"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to save uploaded documents"));
        }

        PolicyApplication app = PolicyApplication.builder()
                .customer(user)
                .insurancePackage(pkg)
                .agent(agent)
                .coverageAmount(coverage)
                .duration(dur)
                .notes(notes)
                .commonInfo(commonInfo)
                .extraInfo(extraInfo)
                .riskLevel(riskLevel)
                .premiumAmount(premiumAmount)
                .policyNumber(policyNumber)
                .documentsPath(documentsJson)
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
        // Only one claim allowed per policy, regardless of that claim's current status
        if (claimRepo.existsByApplication_Id(app.getId())) {
            return ResponseEntity.badRequest().body(Map.of("message", "A claim has already been submitted for this policy. Only one claim is allowed per policy."));
        }

        String documentsJson;
        try {
            documentsJson = FileStorageUtil.toJsonArray(FileStorageUtil.saveDocuments(documents, "claims", "claim"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to save uploaded documents"));
        }

        Claim claim = Claim.builder()
                .application(app)
                .customer(user)
                .agent(app.getAgent())
                .claimType(claimType)
                .amount(new BigDecimal(amount))
                .description(description)
                .incidentDate(LocalDate.parse(incidentDate))
                .documentsPath(documentsJson)
                .status(ClaimStatus.PENDING)
                .build();
        return ResponseEntity.ok(ClaimResponse.from(claimRepo.save(claim)));
    }

    // ── Payments ─────────────────────────────────────────────────────
    @GetMapping("/payments")
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPayments(@AuthenticationPrincipal UserDetails principal) {
        User user = getUser(principal);
        return paymentRepo.findAllByCustomer(user).stream()
                .sorted(Comparator.comparing(Payment::getCreatedAt).reversed())
                .map(PaymentResponse::from).toList();
    }

    private static final java.util.Set<String> VALID_PAYMENT_METHODS = java.util.Set.of("KBZ_PAY", "WAVE_PAY", "AYA_PAY");

    @PostMapping("/payments")
    @Transactional
    public ResponseEntity<?> submitPayment(@AuthenticationPrincipal UserDetails principal,
                                           @RequestParam String applicationId,
                                           @RequestParam(required = false) String paymentMethod,
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
        if (paymentMethod == null || !VALID_PAYMENT_METHODS.contains(paymentMethod)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Please select a valid payment method (KBZPay, Wave Pay, or AYA Pay)"));
        }
        if (screenshot == null || screenshot.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "A payment proof screenshot is required"));
        }

        String screenshotPath;
        try {
            screenshotPath = FileStorageUtil.saveDocument(screenshot, "payments", "payment");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to save screenshot"));
        }

        Payment payment = Payment.builder()
                .application(app)
                .customer(user)
                .amount(app.getPremiumAmount())
                .paymentType("PREMIUM")
                .paymentMethod(paymentMethod)
                .screenshotPath(screenshotPath)
                .notes(notes)
                .status(PaymentStatus.PENDING)
                .build();
        return ResponseEntity.ok(PaymentResponse.from(paymentRepo.save(payment)));
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
