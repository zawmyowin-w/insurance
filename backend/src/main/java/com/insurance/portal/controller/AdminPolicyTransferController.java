package com.insurance.portal.controller;

import com.insurance.portal.model.*;
import com.insurance.portal.model.enums.*;
import com.insurance.portal.repository.*;
import com.insurance.portal.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Admin endpoints for policy ownership transfers.
 *
 * GET  /admin/policy-transfers               — list all transfers (optional ?status=)
 * GET  /admin/policy-transfers/{id}          — get one transfer
 * PUT  /admin/policy-transfers/{id}/approve  — approve (reassigns policy + payments)
 * PUT  /admin/policy-transfers/{id}/reject   — reject
 */
@RestController
@RequestMapping("/admin/policy-transfers")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminPolicyTransferController {

    private final UserRepository userRepo;
    private final PolicyTransferRepository transferRepo;
    private final PolicyApplicationRepository appRepo;
    private final PaymentRepository paymentRepo;
    private final NotificationService notifService;

    private User getAdmin(UserDetails principal) {
        return userRepo.findByEmail(principal.getUsername()).orElseThrow();
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<?> listAll(@RequestParam(required = false) String status) {
        List<PolicyTransfer> transfers;
        if (status != null && !status.isBlank() && !status.equals("ALL")) {
            try {
                transfers = transferRepo.findAllByStatusOrderByCreatedAtDesc(TransferStatus.valueOf(status));
            } catch (IllegalArgumentException e) {
                transfers = transferRepo.findAllByOrderByCreatedAtDesc();
            }
        } else {
            transfers = transferRepo.findAllByOrderByCreatedAtDesc();
        }
        return ResponseEntity.ok(transfers.stream().map(PolicyTransferController::toDto).toList());
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getOne(@PathVariable Long id) {
        PolicyTransfer t = transferRepo.findById(id).orElse(null);
        if (t == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(PolicyTransferController.toDto(t));
    }

    @GetMapping("/pending-count")
    @Transactional(readOnly = true)
    public ResponseEntity<?> pendingCount() {
        long count = transferRepo.countByStatus(TransferStatus.PENDING_ADMIN_APPROVAL);
        return ResponseEntity.ok(Map.of("count", count));
    }

    // ── Approve ───────────────────────────────────────────────────────
    @PutMapping("/{id}/approve")
    @Transactional
    public ResponseEntity<?> approve(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody(required = false) Map<String, String> body) {

        User admin = getAdmin(principal);
        PolicyTransfer transfer = transferRepo.findById(id).orElse(null);
        if (transfer == null) return ResponseEntity.notFound().build();
        if (transfer.getStatus() != TransferStatus.PENDING_ADMIN_APPROVAL)
            return ResponseEntity.badRequest().body(Map.of("message", "Transfer is not in PENDING_ADMIN_APPROVAL status"));

        User newOwner = transfer.getToCustomer();
        User oldOwner = transfer.getFromCustomer();
        PolicyApplication app = transfer.getApplication();

        // ── Re-assign policy ownership ───────────────────────────────
        app.setCustomer(newOwner);
        app.setTransferredAt(LocalDateTime.now());

        // ── Claim eligibility after transfer ──────────────────────────────
        // If the package has a claim waiting period the new owner must serve that
        // period again from the transfer date (they didn't hold the policy before).
        // If there is no waiting period they can claim immediately.
        LocalDate today = LocalDate.now();
        Integer waitMonths = (app.getInsurancePackage() != null)
                ? app.getInsurancePackage().getClaimWaitingPeriodMonths() : null;
        if (waitMonths != null && waitMonths > 0) {
            app.setClaimEligibleFrom(today.plusMonths(waitMonths));
        } else {
            // No waiting period — new owner may claim straight away
            app.setClaimEligibleFrom(today);
        }
        appRepo.save(app);

        // ── Payments: keep VERIFIED records under original owner ──────
        // Only re-assign PENDING / REJECTED payments to the new owner.
        // VERIFIED payments retain the original customer so payment history
        // accurately shows who paid each installment.
        List<Payment> payments = paymentRepo.findAllByApplication_Id(app.getId());
        List<Payment> pendingPayments = payments.stream()
                .filter(p -> p.getStatus() == PaymentStatus.PENDING
                          || p.getStatus() == PaymentStatus.REJECTED)
                .toList();
        for (Payment p : pendingPayments) {
            p.setCustomer(newOwner);
        }
        if (!pendingPayments.isEmpty()) paymentRepo.saveAll(pendingPayments);

        // ── Update transfer record ───────────────────────────────────
        transfer.setStatus(TransferStatus.APPROVED);
        transfer.setApprovedBy(admin);
        transfer.setApprovedAt(LocalDateTime.now());
        if (body != null && body.get("note") != null) transfer.setAdminNote(body.get("note").trim());
        transferRepo.save(transfer);

        // ── Notifications ─────────────────────────────────────────────
        String policyRef = app.getPolicyNumber() != null ? app.getPolicyNumber() : "#" + app.getId();

        notifService.send(newOwner,
                "Policy Transfer Approved",
                String.format("The transfer of policy %s to your account has been approved by admin. " +
                        "You are now the policy owner and are responsible for future premium payments.",
                        policyRef),
                NotificationType.APPROVAL);

        notifService.send(oldOwner,
                "Policy Transfer Completed",
                String.format("Your transfer of policy %s has been approved. " +
                        "You no longer hold ownership of this policy.",
                        policyRef),
                NotificationType.INFO);

        return ResponseEntity.ok(PolicyTransferController.toDto(transfer));
    }

    // ── Reject ────────────────────────────────────────────────────────
    @PutMapping("/{id}/reject")
    @Transactional
    public ResponseEntity<?> reject(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody(required = false) Map<String, String> body) {

        getAdmin(principal);
        PolicyTransfer transfer = transferRepo.findById(id).orElse(null);
        if (transfer == null) return ResponseEntity.notFound().build();
        if (transfer.getStatus() != TransferStatus.PENDING_ADMIN_APPROVAL)
            return ResponseEntity.badRequest().body(Map.of("message", "Transfer is not pending admin approval"));

        transfer.setStatus(TransferStatus.REJECTED);
        if (body != null && body.get("note") != null) transfer.setAdminNote(body.get("note").trim());
        transferRepo.save(transfer);

        String policyRef = transfer.getApplication().getPolicyNumber() != null
                ? transfer.getApplication().getPolicyNumber() : "#" + transfer.getApplication().getId();
        String adminNote = transfer.getAdminNote() != null ? transfer.getAdminNote() : "No reason provided";

        notifService.send(transfer.getFromCustomer(),
                "Policy Transfer Rejected",
                String.format("Your transfer request for policy %s was rejected by admin. Reason: %s",
                        policyRef, adminNote),
                NotificationType.REJECTION);

        notifService.send(transfer.getToCustomer(),
                "Policy Transfer Rejected",
                String.format("The transfer of policy %s to your account was rejected by admin. Reason: %s",
                        policyRef, adminNote),
                NotificationType.REJECTION);

        return ResponseEntity.ok(PolicyTransferController.toDto(transfer));
    }
}
