package com.insurance.portal.controller;

import com.insurance.portal.model.*;
import com.insurance.portal.model.enums.*;
import com.insurance.portal.repository.*;
import com.insurance.portal.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Admin endpoints for: Insurance Types CRUD, Dashboard Stats, Notifications.
 *
 * Applications  → AdminApplicationController
 * Claims        → AdminClaimController
 * Users         → AdminUserController
 * Reports/Wallet → AdminReportsController
 */
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
    private final InsurancePackageRepository packageRepo;
    private final InsuranceTypeRepository insuranceTypeRepo;
    private final NotificationService notifService;

    // ── Insurance Types CRUD ──────────────────────────────────────────

    @GetMapping("/insurance-types")
    @Transactional(readOnly = true)
    public ResponseEntity<?> listInsuranceTypes() {
        return ResponseEntity.ok(insuranceTypeRepo.findAllByOrderByNameAsc().stream()
            .map(t -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id",          t.getId());
                m.put("name",        t.getName());
                m.put("description", t.getDescription() != null ? t.getDescription() : "");
                m.put("benefits",    t.getBenefits()    != null ? t.getBenefits()    : "");
                m.put("rules",       t.getRules()       != null ? t.getRules()       : "");
                m.put("createdAt",   t.getCreatedAt()   != null ? t.getCreatedAt().toString() : "");
                return m;
            })
            .toList());
    }

    @PostMapping("/insurance-types")
    @Transactional
    public ResponseEntity<?> createInsuranceType(@RequestBody Map<String, Object> body) {
        String name = body.getOrDefault("name", "").toString().trim().toUpperCase();
        if (name.isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Name is required"));
        if (insuranceTypeRepo.findByNameIgnoreCase(name).isPresent())
            return ResponseEntity.status(409).body(Map.of("message", "\"" + name + "\" သည် ရှိပြီးသားဖြစ်သည်"));
        String description = body.getOrDefault("description", "").toString().trim();
        String benefits    = body.getOrDefault("benefits",    "").toString().trim();
        String rules       = body.getOrDefault("rules",       "").toString().trim();
        var saved = insuranceTypeRepo.save(InsuranceType.builder()
                .name(name)
                .description(description.isBlank() ? null : description)
                .benefits(benefits.isBlank()    ? null : benefits)
                .rules(rules.isBlank()          ? null : rules)
                .build());
        return ResponseEntity.ok(typeToMap(saved));
    }

    @PutMapping("/insurance-types/{id}")
    @Transactional
    public ResponseEntity<?> updateInsuranceType(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        var type = insuranceTypeRepo.findById(id).orElse(null);
        if (type == null) return ResponseEntity.notFound().build();
        if (body.containsKey("description")) type.setDescription(body.get("description").toString().trim());
        if (body.containsKey("benefits"))    type.setBenefits(body.get("benefits").toString().trim());
        if (body.containsKey("rules"))       type.setRules(body.get("rules").toString().trim());
        return ResponseEntity.ok(typeToMap(insuranceTypeRepo.save(type)));
    }

    @DeleteMapping("/insurance-types/{id}")
    @Transactional
    public ResponseEntity<?> deleteInsuranceType(@PathVariable Long id) {
        if (!insuranceTypeRepo.existsById(id)) return ResponseEntity.notFound().build();
        insuranceTypeRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    // ── Dashboard Stats ───────────────────────────────────────────────

    @GetMapping("/dashboard/stats")
    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCustomers",        userRepo.findAllByRole(Role.CUSTOMER).size());
        stats.put("totalAgents",           userRepo.findAllByRole(Role.AGENT).size());
        stats.put("pendingApplications",   appRepo.countByStatus(ApplicationStatus.PENDING));
        stats.put("pendingClaims",         claimRepo.countByStatus(ClaimStatus.PENDING));
        stats.put("verifiedApplications",  appRepo.countByStatus(ApplicationStatus.VERIFIED));
        stats.put("verifiedClaims",        claimRepo.countByStatus(ClaimStatus.VERIFIED));
        stats.put("totalPackages",         packageRepo.count());

        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        BigDecimal monthlyRevenue = paymentRepo.findAll().stream()
                .filter(p -> p.getStatus() == PaymentStatus.VERIFIED
                        && p.getAmount() != null
                        && p.getCreatedAt() != null
                        && !p.getCreatedAt().isBefore(startOfMonth))
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("monthlyRevenue", monthlyRevenue);
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

    // ── Notifications ─────────────────────────────────────────────────

    @GetMapping("/notifications/sent")
    @Transactional(readOnly = true)
    public List<?> getSentNotifications() {
        return notifRepo.findAll().stream()
                .sorted(Comparator.comparing(Notification::getCreatedAt).reversed())
                .limit(50)
                .map(n -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id",         n.getId());
                    m.put("title",      n.getTitle());
                    m.put("message",    n.getMessage());
                    m.put("type",       n.getType().name());
                    m.put("targetRole", n.getTargetRole());
                    m.put("createdAt",  n.getCreatedAt());
                    return m;
                }).toList();
    }

    @PostMapping("/notifications/send")
    @Transactional
    public ResponseEntity<?> sendNotifications(@RequestBody Map<String, Object> req) {
        String title       = req.get("title").toString();
        String message     = req.get("message").toString();
        String typeStr     = req.getOrDefault("type", "INFO").toString();
        String targetRole  = req.getOrDefault("targetRole", "ALL").toString();
        String targetUserId = req.containsKey("targetUserId") && req.get("targetUserId") != null
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

        notifService.sendToAll(recipients, title, message, type, targetRole);
        return ResponseEntity.ok(Map.of("sent", recipients.size()));
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private Map<String, Object> typeToMap(InsuranceType t) {
        Map<String, Object> m = new HashMap<>();
        m.put("id",          t.getId());
        m.put("name",        t.getName());
        m.put("description", t.getDescription() != null ? t.getDescription() : "");
        m.put("benefits",    t.getBenefits()    != null ? t.getBenefits()    : "");
        m.put("rules",       t.getRules()       != null ? t.getRules()       : "");
        return m;
    }
}
