package com.insurance.portal.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.insurance.portal.dto.*;
import com.insurance.portal.model.*;
import com.insurance.portal.model.enums.*;
import com.insurance.portal.repository.*;
import com.insurance.portal.util.FileStorageUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepo;
    private final PolicyApplicationRepository appRepo;
    private final ClaimRepository claimRepo;
    private final PaymentRepository paymentRepo;
    private final NotificationRepository notifRepo;
    private final PasswordEncoder passwordEncoder;

    // ── Dashboard Stats ───────────────────────────────────────────────
    @GetMapping("/dashboard/stats")
    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCustomers", userRepo.findAllByRole(Role.CUSTOMER).size());
        stats.put("totalAgents", userRepo.findAllByRole(Role.AGENT).size());
        stats.put("pendingApplications", appRepo.countByStatus(ApplicationStatus.VERIFIED));
        stats.put("pendingClaims", claimRepo.countByStatus(ClaimStatus.VERIFIED));
        stats.put("totalPackages", 0);
        stats.put("monthlyRevenue", 0);
        return stats;
    }

    @GetMapping("/recent-activities")
    @Transactional(readOnly = true)
    public List<?> getRecentActivities() {
        return notifRepo.findAll().stream()
                .sorted(Comparator.comparing(Notification::getCreatedAt).reversed())
                .limit(10)
                .map(n -> Map.of("description", n.getTitle(), "createdAt", n.getCreatedAt(), "icon", "bi-activity"))
                .toList();
    }

    // ── Reports ───────────────────────────────────────────────────────
    @GetMapping("/reports")
    @Transactional(readOnly = true)
    public Map<String, Object> getReports() {
        Map<String, Object> r = new LinkedHashMap<>();
        var allApps    = appRepo.findAll();
        var allClaims  = claimRepo.findAll();
        var allPayments = paymentRepo.findAll();

        r.put("totalCustomers",       userRepo.findAllByRole(Role.CUSTOMER).size());
        r.put("totalAgents",          userRepo.findAllByRole(Role.AGENT).size());
        r.put("totalApplications",    allApps.size());
        r.put("activePolicies",       allApps.stream().filter(a -> a.getStatus() == ApplicationStatus.APPROVED).count());
        r.put("pendingApplications",  allApps.stream().filter(a -> a.getStatus() == ApplicationStatus.PENDING || a.getStatus() == ApplicationStatus.VERIFIED).count());
        r.put("rejectedApplications", allApps.stream().filter(a -> a.getStatus() == ApplicationStatus.REJECTED).count());
        r.put("totalClaims",          allClaims.size());
        r.put("approvedClaims",       allClaims.stream().filter(c -> c.getStatus() == ClaimStatus.APPROVED).count());
        r.put("pendingClaims",        allClaims.stream().filter(c -> c.getStatus() == ClaimStatus.PENDING || c.getStatus() == ClaimStatus.VERIFIED).count());
        r.put("rejectedClaims",       allClaims.stream().filter(c -> c.getStatus() == ClaimStatus.REJECTED).count());

        java.math.BigDecimal revenue = allPayments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.VERIFIED && p.getAmount() != null)
                .map(Payment::getAmount)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        r.put("totalRevenue", revenue);

        // Active policies by insurance type
        Map<String, Long> byType = allApps.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.APPROVED && a.getInsurancePackage() != null)
                .collect(java.util.stream.Collectors.groupingBy(
                        a -> a.getInsurancePackage().getType(),
                        java.util.stream.Collectors.counting()));
        r.put("policiesByType", byType);

        // Applications submitted per month (last 6 months)
        Map<String, Long> byMonth = allApps.stream()
                .filter(a -> a.getCreatedAt() != null
                        && a.getCreatedAt().isAfter(java.time.LocalDateTime.now().minusMonths(6)))
                .collect(java.util.stream.Collectors.groupingBy(
                        a -> a.getCreatedAt().getMonth().getDisplayName(
                                java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH)
                                + " " + a.getCreatedAt().getYear(),
                        java.util.LinkedHashMap::new,
                        java.util.stream.Collectors.counting()));
        r.put("applicationsByMonth", byMonth);

        return r;
    }

    // ── Users ─────────────────────────────────────────────────────────
    @GetMapping("/users")
    @Transactional(readOnly = true)
    public List<UserResponse> getUsers() {
        return userRepo.findAll().stream().map(UserResponse::from).toList();
    }

    @PostMapping("/users/agents")
    @Transactional
    public ResponseEntity<?> createAgent(@RequestBody Map<String, Object> req) {
        String email = req.get("email").toString();
        if (!com.insurance.portal.util.EmailValidationUtil.isValid(email)) {
            return ResponseEntity.badRequest().body(Map.of("message", com.insurance.portal.util.EmailValidationUtil.ERROR_MESSAGE));
        }
        if (userRepo.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already in use"));
        }
        User agent = User.builder()
                .name(req.get("name").toString())
                .email(email)
                .password(passwordEncoder.encode(req.get("password").toString()))
                .role(Role.AGENT)
                .phone(req.containsKey("phone") ? req.get("phone").toString() : null)
                .address(req.containsKey("address") ? req.get("address").toString() : null)
                .insuranceType(req.containsKey("insuranceType") ? req.get("insuranceType").toString() : "ALL")
                .active(true)
                .build();
        return ResponseEntity.ok(UserResponse.from(userRepo.save(agent)));
    }

    /**
     * Admin-driven profile edit for any user — this is the only way an
     * agent's profile can be changed (agents cannot self-edit; see
     * AuthController#updateProfile). Also usable for editing customers/admins.
     */
    @PutMapping("/users/{id}")
    @Transactional
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody UpdateProfileRequest req) {
        User user = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));

        if (req.getName() != null && !req.getName().isBlank()) user.setName(req.getName());
        if (req.getEmail() != null && !req.getEmail().isBlank() && !req.getEmail().equalsIgnoreCase(user.getEmail())) {
            if (!com.insurance.portal.util.EmailValidationUtil.isValid(req.getEmail())) {
                return ResponseEntity.badRequest().body(Map.of("message", com.insurance.portal.util.EmailValidationUtil.ERROR_MESSAGE));
            }
            if (userRepo.existsByEmail(req.getEmail())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Email already in use"));
            }
            user.setEmail(req.getEmail());
        }
        if (req.getPhone() != null) user.setPhone(req.getPhone());
        if (req.getAddress() != null) user.setAddress(req.getAddress());
        if (user.getRole() == Role.AGENT && req.getInsuranceType() != null && !req.getInsuranceType().isBlank()) {
            user.setInsuranceType(req.getInsuranceType());
        }
        if (req.getNewPassword() != null && !req.getNewPassword().isBlank()) {
            if (req.getNewPassword().length() < 8) {
                return ResponseEntity.badRequest().body(Map.of("message", "New password must be at least 8 characters"));
            }
            user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        }
        return ResponseEntity.ok(UserResponse.from(userRepo.save(user)));
    }

    /** Admin uploads/replaces any user's profile picture — the only way an agent's picture can be set. */
    @PostMapping(value = "/users/{id}/picture", consumes = "multipart/form-data")
    @Transactional
    public ResponseEntity<?> uploadUserPicture(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        User user = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        try {
            String oldPath = user.getProfilePicture();
            String newPath = FileStorageUtil.saveImage(file, "profile-pictures", "user_" + user.getId());
            if (newPath == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "No file provided"));
            }
            user.setProfilePicture(newPath);
            userRepo.save(user);
            FileStorageUtil.deleteFileQuietly(oldPath);
            return ResponseEntity.ok(UserResponse.from(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /** Stream any user's profile picture (admin view — e.g. in Manage Users). */
    @GetMapping("/users/{id}/picture")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getUserPicture(@PathVariable Long id) throws java.io.IOException {
        User user = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        String path = user.getProfilePicture();
        if (path == null || path.isBlank()) return ResponseEntity.notFound().build();
        File file = new File(path);
        if (!file.exists()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(FileStorageUtil.contentTypeFor(path)))
                .body(new FileSystemResource(file));
    }

    @PutMapping("/users/{id}/toggle")
    @Transactional
    public ResponseEntity<?> toggleUser(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        User user = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setActive(Boolean.TRUE.equals(req.get("active")));
        return ResponseEntity.ok(UserResponse.from(userRepo.save(user)));
    }

    @DeleteMapping("/users/{id}")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        User user = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));

        // 1. Delete notifications belonging to this user
        notifRepo.deleteAllByRecipient(user);

        if (user.getRole() == Role.CUSTOMER) {
            // 2. Delete payments made by this customer
            paymentRepo.deleteAllByCustomer(user);
            // 3. Delete claims submitted by this customer
            claimRepo.deleteAllByCustomer(user);
            // 4. Delete applications submitted by this customer
            appRepo.deleteAllByCustomer(user);
        } else if (user.getRole() == Role.AGENT) {
            // 2. Unlink agent from claims (keep the records, just clear the agent ref)
            claimRepo.clearAgentFromClaims(user);
            // 3. Unlink agent from applications
            appRepo.clearAgentFromApplications(user);
        }

        // 5. Finally delete the user
        userRepo.delete(user);
        return ResponseEntity.ok(Map.of("message", "User deleted"));
    }

    // ── Applications ──────────────────────────────────────────────────
    @GetMapping("/applications")
    @Transactional(readOnly = true)
    public List<ApplicationResponse> getApplications(@RequestParam(required = false) String status) {
        if (status != null && !status.equals("ALL")) {
            try {
                return appRepo.findAllByStatus(ApplicationStatus.valueOf(status)).stream()
                        .sorted(Comparator.comparing(PolicyApplication::getCreatedAt).reversed())
                        .map(ApplicationResponse::from).toList();
            } catch (IllegalArgumentException ignored) {}
        }
        return appRepo.findAll().stream()
                .sorted(Comparator.comparing(PolicyApplication::getCreatedAt).reversed())
                .map(ApplicationResponse::from).toList();
    }

    @PutMapping("/applications/{id}/approve")
    @Transactional
    public ResponseEntity<?> approveApplication(@PathVariable Long id, @RequestBody Map<String, String> req) {
        PolicyApplication app = appRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        if (app.getStatus() != ApplicationStatus.VERIFIED) {
            return ResponseEntity.badRequest().body(Map.of("message", "Only VERIFIED applications can be approved"));
        }
        app.setStatus(ApplicationStatus.APPROVED);
        app.setAdminNote(req.get("note"));
        appRepo.save(app);
        sendNotification(app.getCustomer(),
                "Application Approved! 🎉",
                "Your application for " + app.getInsurancePackage().getName()
                        + " has been approved. Please proceed with payment to activate your policy.",
                NotificationType.APPROVAL);
        return ResponseEntity.ok(ApplicationResponse.from(app));
    }

    @PutMapping("/applications/{id}/reject")
    @Transactional
    public ResponseEntity<?> rejectApplication(@PathVariable Long id, @RequestBody Map<String, String> req) {
        PolicyApplication app = appRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        app.setStatus(ApplicationStatus.REJECTED);
        app.setAdminNote(req.get("note"));
        appRepo.save(app);
        sendNotification(app.getCustomer(),
                "Application Rejected",
                "Your application for " + app.getInsurancePackage().getName()
                        + " was rejected. Reason: " + req.getOrDefault("note", "N/A"),
                NotificationType.REJECTION);
        return ResponseEntity.ok(ApplicationResponse.from(app));
    }

    @PutMapping("/applications/{id}/revise")
    @Transactional
    public ResponseEntity<?> reviseApplication(@PathVariable Long id, @RequestBody Map<String, String> req) {
        PolicyApplication app = appRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        app.setStatus(ApplicationStatus.REVISION_REQUESTED);
        app.setAdminNote(req.get("note"));
        app.setRevisionDeadline(LocalDateTime.now().plusDays(7));
        appRepo.save(app);
        sendNotification(app.getCustomer(),
                "Revision Required for Your Application",
                "Your application requires changes: " + req.getOrDefault("note", "N/A")
                        + ". Please update within 7 days.",
                NotificationType.INFO);
        return ResponseEntity.ok(ApplicationResponse.from(app));
    }

    // ── Claims ────────────────────────────────────────────────────────
    @GetMapping("/claims")
    @Transactional(readOnly = true)
    public List<ClaimResponse> getClaims(@RequestParam(required = false) String status) {
        if (status != null && !status.equals("ALL")) {
            try {
                return claimRepo.findAllByStatus(ClaimStatus.valueOf(status)).stream()
                        .sorted(Comparator.comparing(Claim::getCreatedAt).reversed())
                        .map(ClaimResponse::from).toList();
            } catch (IllegalArgumentException ignored) {}
        }
        return claimRepo.findAll().stream()
                .sorted(Comparator.comparing(Claim::getCreatedAt).reversed())
                .map(ClaimResponse::from).toList();
    }

    @PutMapping("/claims/{id}/approve")
    @Transactional
    public ResponseEntity<?> approveClaim(@PathVariable Long id, @RequestBody Map<String, String> req) {
        Claim claim = claimRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Claim not found"));
        if (claim.getStatus() != ClaimStatus.VERIFIED) {
            return ResponseEntity.badRequest().body(Map.of("message", "Only VERIFIED claims can be approved"));
        }
        claim.setStatus(ClaimStatus.APPROVED);
        claim.setAdminNote(req.get("note"));
        claimRepo.save(claim);
        sendNotification(claim.getCustomer(),
                "Claim Approved ✅",
                "Your claim of " + claim.getAmount() + " MMK has been approved. Compensation will be disbursed shortly.",
                NotificationType.APPROVAL);
        return ResponseEntity.ok(ClaimResponse.from(claim));
    }

    @PutMapping("/claims/{id}/reject")
    @Transactional
    public ResponseEntity<?> rejectClaim(@PathVariable Long id, @RequestBody Map<String, String> req) {
        Claim claim = claimRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Claim not found"));
        claim.setStatus(ClaimStatus.REJECTED);
        claim.setAdminNote(req.get("note"));
        claimRepo.save(claim);
        sendNotification(claim.getCustomer(),
                "Claim Rejected",
                "Your claim was rejected. Reason: " + req.getOrDefault("note", "N/A"),
                NotificationType.REJECTION);
        return ResponseEntity.ok(ClaimResponse.from(claim));
    }

    @PutMapping("/claims/{id}/revise")
    @Transactional
    public ResponseEntity<?> reviseClaim(@PathVariable Long id, @RequestBody Map<String, String> req) {
        Claim claim = claimRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Claim not found"));
        claim.setStatus(ClaimStatus.REVISION_REQUESTED);
        claim.setAdminNote(req.get("note"));
        claim.setRevisionDeadline(LocalDateTime.now().plusDays(7));
        claimRepo.save(claim);
        sendNotification(claim.getCustomer(),
                "Claim Revision Required",
                "Additional information is needed for your claim: " + req.getOrDefault("note", "N/A"),
                NotificationType.INFO);
        return ResponseEntity.ok(ClaimResponse.from(claim));
    }

    // ── Notifications ─────────────────────────────────────────────────
    @GetMapping("/notifications/sent")
    @Transactional(readOnly = true)
    public List<?> getSentNotifications() {
        return notifRepo.findAll().stream()
                .sorted(Comparator.comparing(Notification::getCreatedAt).reversed())
                .limit(50)
                .map(n -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", n.getId());
                    m.put("title", n.getTitle());
                    m.put("message", n.getMessage());
                    m.put("type", n.getType().name());
                    m.put("targetRole", n.getTargetRole());
                    m.put("createdAt", n.getCreatedAt());
                    return m;
                }).toList();
    }

    @PostMapping("/notifications/send")
    @Transactional
    public ResponseEntity<?> sendNotifications(@RequestBody Map<String, Object> req) {
        String title   = req.get("title").toString();
        String message = req.get("message").toString();
        String typeStr = req.getOrDefault("type", "INFO").toString();
        String targetRole    = req.getOrDefault("targetRole", "ALL").toString();
        String targetUserId  = req.containsKey("targetUserId") && req.get("targetUserId") != null
                ? req.get("targetUserId").toString() : null;

        NotificationType type;
        try { type = NotificationType.valueOf(typeStr); } catch (Exception e) { type = NotificationType.INFO; }

        List<User> recipients = new ArrayList<>();
        if (targetUserId != null && !targetUserId.isBlank()) {
            userRepo.findById(Long.valueOf(targetUserId)).ifPresent(recipients::add);
        } else switch (targetRole) {
            case "CUSTOMER" -> recipients.addAll(userRepo.findAllByRole(Role.CUSTOMER));
            case "AGENT"    -> recipients.addAll(userRepo.findAllByRole(Role.AGENT));
            default         -> recipients.addAll(userRepo.findAll());
        }

        final NotificationType finalType = type;
        final String finalTargetRole = targetRole;
        List<Notification> notifications = recipients.stream().map(u ->
                Notification.builder()
                        .recipient(u).title(title).message(message)
                        .type(finalType).targetRole(finalTargetRole)
                        .build()
        ).toList();
        notifRepo.saveAll(notifications);
        return ResponseEntity.ok(Map.of("sent", notifications.size()));
    }

    // ── Form field file serving ───────────────────────────────────────
    /** Serve a file uploaded into a dynamic form field for an application */
    @GetMapping("/applications/{id}/form-file/{fieldId}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getApplicationFormFile(@PathVariable Long id, @PathVariable String fieldId) {
        PolicyApplication app = appRepo.findById(id).orElseThrow();
        return serveFormFile(app.getFormData(), fieldId);
    }

    /** Serve a file uploaded into a dynamic form field for a claim */
    @GetMapping("/claims/{id}/form-file/{fieldId}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getClaimFormFile(@PathVariable Long id, @PathVariable String fieldId) {
        Claim claim = claimRepo.findById(id).orElseThrow();
        return serveFormFile(claim.getFormData(), fieldId);
    }

    // ── Helpers ───────────────────────────────────────────────────────
    @SuppressWarnings("unchecked")
    private ResponseEntity<?> serveFormFile(String formDataJson, String fieldId) {
        if (formDataJson == null) return ResponseEntity.notFound().build();
        try {
            Map<String, Object> data = new ObjectMapper().readValue(formDataJson, Map.class);
            Object val = data.get(fieldId);
            if (val == null) return ResponseEntity.notFound().build();
            File file = new File(val.toString());
            if (!file.exists()) return ResponseEntity.notFound().build();
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(FileStorageUtil.contentTypeFor(val.toString())))
                    .body(new FileSystemResource(file));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private void sendNotification(User recipient, String title, String message, NotificationType type) {
        notifRepo.save(Notification.builder()
                .recipient(recipient).title(title).message(message).type(type).build());
    }
}
