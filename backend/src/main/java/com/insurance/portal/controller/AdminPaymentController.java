package com.insurance.portal.controller;

import com.insurance.portal.dto.PaymentResponse;
import com.insurance.portal.model.Notification;
import com.insurance.portal.model.Payment;
import com.insurance.portal.model.User;
import com.insurance.portal.model.enums.NotificationType;
import com.insurance.portal.model.enums.PaymentStatus;
import com.insurance.portal.repository.NotificationRepository;
import com.insurance.portal.repository.PaymentRepository;
import com.insurance.portal.repository.UserRepository;
import com.insurance.portal.util.FileStorageUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/payments")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminPaymentController {

    private final PaymentRepository paymentRepo;
    private final UserRepository userRepo;
    private final NotificationRepository notifRepo;

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
        return payments.stream()
                .sorted(Comparator.comparing(Payment::getCreatedAt).reversed())
                .map(PaymentResponse::from).toList();
    }

    @PutMapping("/{id}/verify")
    @Transactional
    public ResponseEntity<?> verifyPayment(@PathVariable Long id, @RequestBody(required = false) Map<String, String> req,
                                           @AuthenticationPrincipal UserDetails principal) {
        Payment payment = paymentRepo.findById(id).orElseThrow(() -> new RuntimeException("Payment not found"));
        if (payment.getStatus() != PaymentStatus.PENDING) {
            return ResponseEntity.badRequest().body(Map.of("message", "Only PENDING payments can be verified"));
        }
        User admin = userRepo.findByEmail(principal.getUsername()).orElse(null);
        payment.setStatus(PaymentStatus.VERIFIED);
        payment.setVerifiedBy(admin != null ? admin.getName() : "Admin");
        if (req != null && req.get("note") != null) payment.setNotes(req.get("note"));
        paymentRepo.save(payment);
        notifRepo.save(Notification.builder()
                .recipient(payment.getCustomer())
                .title("Payment Verified")
                .message("Your payment of " + payment.getAmount() + " MMK has been verified. Thank you!")
                .type(NotificationType.PAYMENT)
                .build());
        return ResponseEntity.ok(PaymentResponse.from(payment));
    }

    @PutMapping("/{id}/reject")
    @Transactional
    public ResponseEntity<?> rejectPayment(@PathVariable Long id, @RequestBody(required = false) Map<String, String> req) {
        Payment payment = paymentRepo.findById(id).orElseThrow(() -> new RuntimeException("Payment not found"));
        if (payment.getStatus() != PaymentStatus.PENDING) {
            return ResponseEntity.badRequest().body(Map.of("message", "Only PENDING payments can be rejected"));
        }
        String note = req != null ? req.getOrDefault("note", "N/A") : "N/A";
        payment.setStatus(PaymentStatus.REJECTED);
        payment.setNotes(note);
        paymentRepo.save(payment);
        notifRepo.save(Notification.builder()
                .recipient(payment.getCustomer())
                .title("Payment Rejected")
                .message("Your payment submission was rejected. Reason: " + note + ". Please resubmit with a valid screenshot.")
                .type(NotificationType.REJECTION)
                .build());
        return ResponseEntity.ok(PaymentResponse.from(payment));
    }

    @GetMapping("/{id}/screenshot")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getScreenshot(@PathVariable Long id) {
        Payment payment = paymentRepo.findById(id).orElseThrow(() -> new RuntimeException("Payment not found"));
        if (payment.getScreenshotPath() == null || payment.getScreenshotPath().isBlank()) {
            return ResponseEntity.notFound().build();
        }
        File file = new File(payment.getScreenshotPath());
        if (!file.exists()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(FileStorageUtil.contentTypeFor(payment.getScreenshotPath())))
                .body(new FileSystemResource(file));
    }
}
