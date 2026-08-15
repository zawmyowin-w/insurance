package com.insurance.portal.controller;

import com.insurance.portal.dto.PaymentResponse;
import com.insurance.portal.model.Payment;
import com.insurance.portal.model.PolicyApplication;
import com.insurance.portal.model.User;
import com.insurance.portal.model.enums.NotificationType;
import com.insurance.portal.model.enums.PaymentStatus;
import com.insurance.portal.repository.PaymentRepository;
import com.insurance.portal.repository.PolicyApplicationRepository;
import com.insurance.portal.repository.UserRepository;
import com.insurance.portal.service.NotificationService;
import com.insurance.portal.util.FileStorageUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/payments")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminPaymentController {

    private final PaymentRepository paymentRepo;
    private final UserRepository userRepo;
    private final NotificationService notifService;
    private final PolicyApplicationRepository appRepo;

    /**
     * Returns payments grouped: multi-period batch payments appear as ONE consolidated row
     * (the representative record carries batchRef, batchPeriods, batchIds, batchSize).
     * Single-period and legacy payments appear as individual rows.
     */
    @GetMapping
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPayments(@RequestParam(required = false) String status) {
        List<Payment> payments;
        if (status != null && !status.isEmpty() && !status.equalsIgnoreCase("ALL")) {
            try {
                payments = paymentRepo.findAllByStatus(PaymentStatus.valueOf(status));
            } catch (IllegalArgumentException e) {
                payments = paymentRepo.findAll();
            }
        } else {
            payments = paymentRepo.findAll();
        }

        // Separate batched from single payments
        Map<String, List<Payment>> byBatch = new LinkedHashMap<>();
        List<Payment> singles = new ArrayList<>();

        for (Payment p : payments) {
            if (p.getBatchRef() != null && !p.getBatchRef().isBlank()) {
                byBatch.computeIfAbsent(p.getBatchRef(), k -> new ArrayList<>()).add(p);
            } else {
                singles.add(p);
            }
        }

        List<PaymentResponse> result = new ArrayList<>();

        // Consolidated batch rows
        for (List<Payment> batch : byBatch.values()) {
            result.add(PaymentResponse.fromBatch(batch));
        }

        // Individual single rows
        for (Payment p : singles) {
            result.add(PaymentResponse.from(p));
        }

        // Sort by createdAt desc
        result.sort(Comparator.comparing(PaymentResponse::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())));
        return result;
    }

    /**
     * Verify a payment by ID.
     * If the payment belongs to a batch (batchRef != null), verifies ALL records in the batch.
     */
    @PutMapping("/{id}/verify")
    @Transactional
    public ResponseEntity<?> verifyPayment(@PathVariable Long id,
                                           @RequestBody(required = false) Map<String, String> req,
                                           @AuthenticationPrincipal UserDetails principal) {
        Payment payment = paymentRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        if (payment.getStatus() != PaymentStatus.PENDING) {
            return ResponseEntity.badRequest().body(Map.of("message", "Only PENDING payments can be verified"));
        }

        User admin = userRepo.findByEmail(principal.getUsername()).orElse(null);
        String adminName = admin != null ? admin.getName() : "Admin";
        String note = req != null ? req.getOrDefault("note", null) : null;

        List<Payment> toVerify;
        if (payment.getBatchRef() != null && !payment.getBatchRef().isBlank()) {
            // Batch: verify all records sharing this batchRef
            toVerify = paymentRepo.findAllByBatchRef(payment.getBatchRef());
        } else {
            toVerify = List.of(payment);
        }

        for (Payment p : toVerify) {
            p.setStatus(PaymentStatus.VERIFIED);
            p.setVerifiedBy(adminName);
            if (note != null) p.setNotes(note);
            paymentRepo.save(p);

            // Set claimEligibleFrom on first verified payment
            PolicyApplication app = p.getApplication();
            if (app != null && app.getClaimEligibleFrom() == null) {
                boolean wasFirstVerified = !paymentRepo.existsByApplication_IdAndStatusAndIdNot(
                        app.getId(), PaymentStatus.VERIFIED, p.getId());
                if (wasFirstVerified) {
                    Integer waitMonths = (app.getInsurancePackage() != null)
                            ? app.getInsurancePackage().getClaimWaitingPeriodMonths() : null;
                    if (waitMonths != null && waitMonths > 0) {
                        app.setClaimEligibleFrom(LocalDate.now().plusMonths(waitMonths));
                        appRepo.save(app);
                    }
                }
            }
        }

        // Send ONE notification for the batch / single payment
        Payment rep = toVerify.get(0);
        PolicyApplication repApp = rep.getApplication();
        String periodInfo = toVerify.stream()
                .map(p -> p.getPeriodLabel() != null ? p.getPeriodLabel() : (p.getPeriodNumber() != null ? "Period " + p.getPeriodNumber() : ""))
                .filter(s -> !s.isBlank())
                .collect(Collectors.joining(", "));

        String notifMsg;
        if (toVerify.size() > 1) {
            notifMsg = "Your batch payment covering " + toVerify.size() + " periods (" + periodInfo + ") has been verified. Thank you!";
        } else {
            notifMsg = "Your payment" + (periodInfo.isBlank() ? "" : " for " + periodInfo) + " of " + rep.getAmount() + " MMK has been verified. Thank you!";
        }
        if (repApp != null && repApp.getClaimEligibleFrom() != null) {
            notifMsg += " You will be eligible to submit a claim from " + repApp.getClaimEligibleFrom() + ".";
        }
        notifService.send(rep.getCustomer(), "Payment Verified", notifMsg, NotificationType.PAYMENT);

        return ResponseEntity.ok(PaymentResponse.fromBatch(toVerify));
    }

    /**
     * Reject a payment by ID.
     * If the payment belongs to a batch, rejects ALL records in the batch.
     */
    @PutMapping("/{id}/reject")
    @Transactional
    public ResponseEntity<?> rejectPayment(@PathVariable Long id,
                                           @RequestBody(required = false) Map<String, String> req) {
        Payment payment = paymentRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        if (payment.getStatus() != PaymentStatus.PENDING) {
            return ResponseEntity.badRequest().body(Map.of("message", "Only PENDING payments can be rejected"));
        }

        String note = req != null ? req.getOrDefault("note", "N/A") : "N/A";

        List<Payment> toReject;
        if (payment.getBatchRef() != null && !payment.getBatchRef().isBlank()) {
            toReject = paymentRepo.findAllByBatchRef(payment.getBatchRef());
        } else {
            toReject = List.of(payment);
        }

        for (Payment p : toReject) {
            p.setStatus(PaymentStatus.REJECTED);
            p.setNotes(note);
            paymentRepo.save(p);
        }

        Payment rep = toReject.get(0);
        String periodInfo = toReject.stream()
                .map(p -> p.getPeriodLabel() != null ? p.getPeriodLabel() : (p.getPeriodNumber() != null ? "Period " + p.getPeriodNumber() : ""))
                .filter(s -> !s.isBlank())
                .collect(Collectors.joining(", "));

        String notifMsg = toReject.size() > 1
            ? "Your batch payment covering " + toReject.size() + " periods (" + periodInfo + ") was rejected. Reason: " + note + ". Please resubmit."
            : "Your payment" + (periodInfo.isBlank() ? "" : " for " + periodInfo) + " was rejected. Reason: " + note + ". Please resubmit with a valid screenshot.";
        notifService.send(rep.getCustomer(), "Payment Rejected", notifMsg, NotificationType.REJECTION);

        return ResponseEntity.ok(PaymentResponse.fromBatch(toReject));
    }

    @GetMapping("/{id}/screenshot")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getScreenshot(@PathVariable Long id) {
        Payment payment = paymentRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        if (payment.getScreenshotPath() == null || payment.getScreenshotPath().isBlank()) {
            return ResponseEntity.notFound().build();
        }
        return FileStorageUtil.streamFile(payment.getScreenshotPath());
    }
}
