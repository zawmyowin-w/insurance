package com.insurance.portal.controller;

import com.insurance.portal.model.*;
import com.insurance.portal.model.enums.*;
import com.insurance.portal.repository.*;
import com.insurance.portal.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Admin endpoints for the Premium Waiver Benefit (PWB) workflow.
 *
 * Flow:
 *  1. Customer submits emergency form  → /customer/applications/{id}/emergency
 *  2. Admin reviews → POST /admin/applications/{id}/waiver/approve | /reject
 *  3. On approve:  all future payments are bulk-WAIVED
 *  4. At maturity: POST /admin/applications/{id}/waiver/maturity-payout
 *     → creates an auto-approved PREMIUM_WAIVER Claim for the customer
 */
@RestController
@RequestMapping("/admin/applications")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminWaiverController {

    private final PolicyApplicationRepository appRepo;
    private final PaymentRepository           paymentRepo;
    private final ClaimRepository             claimRepo;
    private final UserRepository              userRepo;
    private final NotificationService         notifService;

    // ── Approve waiver ──────────────────────────────────────────────────
    @PostMapping("/{id}/waiver/approve")
    @Transactional
    public ResponseEntity<?> approveWaiver(
            @PathVariable Long id,
            @RequestBody Map<String, String> req,
            @AuthenticationPrincipal UserDetails principal) {

        PolicyApplication app = appRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (app.getEmergencyStatus() != EmergencyStatus.PENDING) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "No pending emergency declaration found"));
        }

        String adminSignature = req.get("adminSignature");
        if (adminSignature == null || adminSignature.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Admin signature is required"));
        }

        // Approve the waiver
        app.setEmergencyStatus(EmergencyStatus.APPROVED);
        app.setWaiverGrantedAt(LocalDateTime.now());
        app.setAdminWaiverSignature(adminSignature);
        app.setAdminWaiverSignedAt(LocalDateTime.now());
        if (req.containsKey("note") && req.get("note") != null) {
            app.setAdminNote(req.get("note"));
        }

        // Bulk-waive all non-PAID, non-WAIVED payment entries
        List<Payment> payments = paymentRepo.findAllByApplication_Id(id);
        int waived = 0;
        for (Payment p : payments) {
            if (p.getStatus() != PaymentStatus.VERIFIED && p.getStatus() != PaymentStatus.WAIVED) {
                p.setStatus(PaymentStatus.WAIVED);
                p.setNotes("Premium waived — Premium Waiver Benefit approved by admin on "
                        + LocalDate.now() + " (Policy: " + app.getPolicyNumber() + ")");
                paymentRepo.save(p);
                waived++;
            }
        }

        // Synthesize WAIVED records for future installments that have no payment row yet
        var pkg = app.getInsurancePackage();
        if (pkg != null && pkg.getPaymentIntervalMonths() != null && pkg.getPaymentIntervalMonths() > 0
                && app.getDuration() != null && app.getPremiumAmount() != null) {

            int total = (app.getDuration() * 12) / pkg.getPaymentIntervalMonths();
            BigDecimal installmentAmount = total > 0
                    ? app.getPremiumAmount().divide(BigDecimal.valueOf(total), 2, java.math.RoundingMode.HALF_UP)
                    : app.getPremiumAmount();

            Set<Integer> existingPeriods = new HashSet<>();
            for (Payment p : payments) {
                if (p.getPeriodNumber() != null) existingPeriods.add(p.getPeriodNumber());
            }

            for (int n = 1; n <= total; n++) {
                if (!existingPeriods.contains(n)) {
                    Payment waiver = Payment.builder()
                            .application(app)
                            .customer(app.getCustomer())
                            .amount(installmentAmount)
                            .paymentType("PREMIUM")
                            .status(PaymentStatus.WAIVED)
                            .periodNumber(n)
                            .notes("Premium waived — Premium Waiver Benefit")
                            .build();
                    paymentRepo.save(waiver);
                    waived++;
                }
            }
        }

        appRepo.save(app);
        log.info("[Waiver] Approved for application #{} — {} installments waived", id, waived);

        // Notify customer
        User customer = app.getCustomer();
        if (customer != null) {
            notifService.send(customer,
                    "Premium Waiver Benefit Approved",
                    "Your emergency declaration for policy " + app.getPolicyNumber()
                    + " has been approved. All remaining premium installments are now waived. "
                    + "Your policy will mature normally and no further payments are required.",
                    NotificationType.APPROVAL);
        }

        return ResponseEntity.ok(Map.of(
                "message", "Waiver approved. " + waived + " installments waived.",
                "waiverGrantedAt", app.getWaiverGrantedAt().toString()
        ));
    }

    // ── Reject waiver ───────────────────────────────────────────────────
    @PostMapping("/{id}/waiver/reject")
    @Transactional
    public ResponseEntity<?> rejectWaiver(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> req) {

        PolicyApplication app = appRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (app.getEmergencyStatus() != EmergencyStatus.PENDING) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "No pending emergency declaration found"));
        }

        app.setEmergencyStatus(EmergencyStatus.REJECTED);
        if (req != null && req.containsKey("note")) {
            app.setAdminNote(req.get("note"));
        }
        appRepo.save(app);

        // Notify customer
        User customer = app.getCustomer();
        if (customer != null) {
            notifService.send(customer,
                    "Premium Waiver Benefit — Declaration Not Approved",
                    "Your emergency declaration for policy " + app.getPolicyNumber()
                    + " could not be approved at this time. "
                    + (req != null && req.get("note") != null ? "Reason: " + req.get("note") : "")
                    + " Please contact us for more information.",
                    NotificationType.REJECTION);
        }

        return ResponseEntity.ok(Map.of("message", "Waiver rejected."));
    }

    // ── Issue maturity payout ───────────────────────────────────────────
    @PostMapping("/{id}/waiver/maturity-payout")
    @Transactional
    public ResponseEntity<?> issueMaturePayout(
            @PathVariable Long id,
            @RequestBody Map<String, String> req,
            @AuthenticationPrincipal UserDetails principal) {

        PolicyApplication app = appRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (app.getEmergencyStatus() != EmergencyStatus.APPROVED) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Waiver must be approved before issuing maturity payout"));
        }
        if (app.getStatus() != ApplicationStatus.APPROVED) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Policy is not in APPROVED status"));
        }

        String adminSignature = req.get("adminSignature");
        if (adminSignature == null || adminSignature.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Admin signature is required for payout issuance"));
        }

        // Create an auto-approved PREMIUM_WAIVER claim
        Claim claim = Claim.builder()
                .application(app)
                .customer(app.getCustomer())
                .agent(app.getAgent())
                .claimType("PREMIUM_WAIVER")
                .amount(app.getCoverageAmount() != null ? app.getCoverageAmount() : BigDecimal.ZERO)
                .description("Policy matured under Premium Waiver Benefit. Coverage amount paid out upon policy maturity. "
                        + "Waiver granted: " + (app.getWaiverGrantedAt() != null ? app.getWaiverGrantedAt().toLocalDate() : "N/A")
                        + ". Policy: " + app.getPolicyNumber())
                .status(ClaimStatus.APPROVED)
                .adminSignature(adminSignature)
                .adminSignedAt(LocalDateTime.now())
                .adminNote("Maturity payout issued by " + principal.getUsername()
                        + " on " + LocalDate.now() + " under Premium Waiver Benefit.")
                .build();
        claimRepo.save(claim);

        // Mark application as CLAIMED
        app.setStatus(ApplicationStatus.CLAIMED);
        appRepo.save(app);

        log.info("[Waiver] Maturity payout issued for application #{} — claim #{}", id, claim.getId());

        // Notify customer
        User customer = app.getCustomer();
        if (customer != null) {
            notifService.send(customer,
                    "Policy Matured — Premium Waiver Payout Ready",
                    "Your policy " + app.getPolicyNumber()
                    + " has matured. Your Premium Waiver Benefit payout of "
                    + (app.getCoverageAmount() != null ? app.getCoverageAmount().toPlainString() : "—") + " MMK"
                    + " is now available in your My Claims section. Please download your payout voucher.",
                    NotificationType.CLAIM);
        }

        return ResponseEntity.ok(Map.of(
                "message", "Maturity payout issued successfully.",
                "claimId", claim.getId()
        ));
    }
}
