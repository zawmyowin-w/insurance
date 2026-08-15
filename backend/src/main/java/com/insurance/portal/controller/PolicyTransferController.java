package com.insurance.portal.controller;

import com.insurance.portal.model.*;
import com.insurance.portal.model.enums.*;
import com.insurance.portal.repository.*;
import com.insurance.portal.service.NotificationService;
import com.insurance.portal.util.DigitalSignatureUtil;
import com.insurance.portal.util.FileStorageUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.insurance.portal.model.enums.PaymentStatus;
import com.insurance.portal.repository.PaymentRepository;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Customer-facing endpoints for policy ownership transfers.
 *
 * POST /customer/policy-transfers              — submit a new transfer request
 * GET  /customer/policy-transfers              — list all transfers (as sender or receiver)
 * PUT  /customer/policy-transfers/{id}/accept  — transferee accepts and signs
 * PUT  /customer/policy-transfers/{id}/reject  — transferee rejects
 */
@RestController
@RequestMapping("/customer/policy-transfers")
@PreAuthorize("hasRole('CUSTOMER')")
@RequiredArgsConstructor
public class PolicyTransferController {

    private final UserRepository userRepo;
    private final PolicyApplicationRepository appRepo;
    private final PolicyTransferRepository transferRepo;
    private final PaymentRepository paymentRepo;
    private final NotificationService notifService;

    private User getUser(UserDetails principal) {
        return userRepo.findByEmail(principal.getUsername()).orElseThrow();
    }

    // ── Submit transfer request ────────────────────────────────────────
    @PostMapping(consumes = { "multipart/form-data", "application/x-www-form-urlencoded", "application/json" })
    @Transactional
    public ResponseEntity<?> submitTransfer(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(value = "applicationId",      required = false) String appIdStr,
            @RequestParam(value = "toEmail",            required = false) String toEmail,
            @RequestParam(value = "relationship",       required = false) String relation,
            @RequestParam(value = "relationshipDetail", required = false) String relationshipDetail,
            @RequestParam(value = "reason",             required = false) String reason,
            @RequestParam(value = "fromSignature",      required = false) String sig,
            @RequestParam(value = "evidenceFiles",      required = false) List<MultipartFile> evidenceFiles) {

        User from = getUser(principal);

        if (appIdStr == null || toEmail == null || relation == null || reason == null)
            return ResponseEntity.badRequest().body(Map.of("message", "applicationId, toEmail, relationship, and reason are required"));

        String sigErr = DigitalSignatureUtil.validationError(sig);
        if (sigErr != null) return ResponseEntity.badRequest().body(Map.of("message", sigErr));

        Long appId = Long.parseLong(appIdStr);
        PolicyApplication app = appRepo.findById(appId).orElse(null);
        if (app == null) return ResponseEntity.badRequest().body(Map.of("message", "Policy not found"));
        if (!app.getCustomer().getId().equals(from.getId()))
            return ResponseEntity.status(403).body(Map.of("message", "This policy does not belong to you"));
        if (app.getStatus() != ApplicationStatus.APPROVED)
            return ResponseEntity.badRequest().body(Map.of("message", "Only approved policies can be transferred"));

        // ── Package-level transfer eligibility checks ─────────────────
        var pkg = app.getInsurancePackage();
        if (pkg == null || !pkg.isTransferAllowed())
            return ResponseEntity.badRequest().body(Map.of("message",
                    "Ownership transfer is not permitted for this insurance package"));

        // Must have at least one VERIFIED payment before transfer is allowed
        List<com.insurance.portal.model.Payment> payments = paymentRepo.findAllByApplication_Id(appId);
        boolean hasVerifiedPayment = payments.stream()
                .anyMatch(p -> p.getStatus() == PaymentStatus.VERIFIED);
        if (!hasVerifiedPayment)
            return ResponseEntity.badRequest().body(Map.of("message",
                    "Transfer is not allowed until the first premium payment has been verified by admin"));

        // Must have been approved for the minimum holding period defined on the package
        int requiredMonths = 0;
        if (pkg.getTransferEligibleAfterYears() != null) requiredMonths += pkg.getTransferEligibleAfterYears() * 12;
        if (pkg.getTransferEligibleAfterMonths() != null) requiredMonths += pkg.getTransferEligibleAfterMonths();

        if (requiredMonths > 0) {
            LocalDateTime approvedAt = app.getApprovedAt() != null ? app.getApprovedAt() : app.getCreatedAt();
            if (approvedAt == null || ChronoUnit.MONTHS.between(approvedAt, LocalDateTime.now()) < requiredMonths) {
                long monthsHeld = approvedAt != null ? ChronoUnit.MONTHS.between(approvedAt, LocalDateTime.now()) : 0;
                int yearsReq = requiredMonths / 12;
                int monthsReq = requiredMonths % 12;
                String reqLabel = yearsReq > 0
                        ? yearsReq + " year" + (yearsReq > 1 ? "s" : "") + (monthsReq > 0 ? " " + monthsReq + " month" + (monthsReq > 1 ? "s" : "") : "")
                        : monthsReq + " month" + (monthsReq > 1 ? "s" : "");
                return ResponseEntity.badRequest().body(Map.of("message",
                        "Transfer is not allowed yet. This policy must be held for at least " + reqLabel +
                        " before transfer. Currently held: " + monthsHeld + " month(s)"));
            }
        }

        // Check no pending transfer already exists for this policy
        List<TransferStatus> activeStatuses = List.of(
                TransferStatus.PENDING_TRANSFEREE_SIGNATURE,
                TransferStatus.PENDING_ADMIN_APPROVAL);
        if (transferRepo.existsByApplication_IdAndStatusIn(appId, activeStatuses))
            return ResponseEntity.badRequest().body(Map.of("message", "A transfer request for this policy is already in progress"));

        // Find the target customer
        User to = userRepo.findByEmail(toEmail.trim().toLowerCase()).orElse(null);
        if (to == null || to.getRole() != Role.CUSTOMER || !to.isActive())
            return ResponseEntity.badRequest().body(Map.of("message", "No active customer account found with that email"));
        if (to.getId().equals(from.getId()))
            return ResponseEntity.badRequest().body(Map.of("message", "You cannot transfer a policy to yourself"));

        // Save evidence files
        List<String> filePaths = new ArrayList<>();
        if (evidenceFiles != null) {
            for (MultipartFile f : evidenceFiles) {
                if (f != null && !f.isEmpty()) {
                    try {
                        String path = FileStorageUtil.saveDocument(f, "transfer_evidence", "transfer_" + appIdStr);
                        if (path != null) filePaths.add(path);
                    } catch (IOException e) {
                        return ResponseEntity.badRequest().body(Map.of("message", "File upload failed: " + e.getMessage()));
                    }
                }
            }
        }

        PolicyTransfer transfer = PolicyTransfer.builder()
                .application(app)
                .fromCustomer(from)
                .toCustomer(to)
                .relationship(relation.trim())
                .relationshipDetail(relationshipDetail != null && !relationshipDetail.isBlank() ? relationshipDetail.trim() : null)
                .reason(reason.trim())
                .evidenceFilesJson(FileStorageUtil.toJsonArray(filePaths))
                .fromSignature(sig)
                .fromSignedAt(LocalDateTime.now())
                .status(TransferStatus.PENDING_TRANSFEREE_SIGNATURE)
                .build();

        PolicyTransfer saved = transferRepo.save(transfer);

        // Notify transferee
        notifService.send(to,
                "Policy Transfer Request",
                String.format("%s is requesting to transfer policy %s to you. Please review and accept or reject.",
                        from.getName(), app.getPolicyNumber() != null ? app.getPolicyNumber() : "#" + app.getId()),
                NotificationType.INFO);

        return ResponseEntity.ok(toDto(saved));
    }

    // ── List my transfers (sent + received) ───────────────────────────
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<?> listTransfers(@AuthenticationPrincipal UserDetails principal) {
        User user = getUser(principal);
        Set<Long> seen = new HashSet<>();
        List<Map<String, Object>> result = new ArrayList<>();

        for (PolicyTransfer t : transferRepo.findAllByFromCustomerOrderByCreatedAtDesc(user)) {
            if (seen.add(t.getId())) result.add(toDto(t));
        }
        for (PolicyTransfer t : transferRepo.findAllByToCustomerOrderByCreatedAtDesc(user)) {
            if (seen.add(t.getId())) result.add(toDto(t));
        }
        result.sort(Comparator.comparing(m -> ((String) m.get("createdAt")), Comparator.reverseOrder()));
        return ResponseEntity.ok(result);
    }

    // ── Transferee accepts and signs ──────────────────────────────────
    @PutMapping("/{id}/accept")
    @Transactional
    public ResponseEntity<?> acceptTransfer(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, String> body) {

        User user = getUser(principal);
        PolicyTransfer transfer = transferRepo.findById(id).orElse(null);
        if (transfer == null) return ResponseEntity.notFound().build();
        if (!transfer.getToCustomer().getId().equals(user.getId()))
            return ResponseEntity.status(403).body(Map.of("message", "This transfer is not addressed to you"));
        if (transfer.getStatus() != TransferStatus.PENDING_TRANSFEREE_SIGNATURE)
            return ResponseEntity.badRequest().body(Map.of("message", "This transfer is no longer awaiting your signature"));

        String sig = body.get("toSignature");
        String sigErr = DigitalSignatureUtil.validationError(sig);
        if (sigErr != null) return ResponseEntity.badRequest().body(Map.of("message", sigErr));

        transfer.setToSignature(sig);
        transfer.setToSignedAt(LocalDateTime.now());
        transfer.setStatus(TransferStatus.PENDING_ADMIN_APPROVAL);
        transferRepo.save(transfer);

        // Notify original owner and admin
        notifService.send(transfer.getFromCustomer(),
                "Transfer Accepted",
                String.format("%s has accepted your transfer request for policy %s. Awaiting admin approval.",
                        user.getName(),
                        transfer.getApplication().getPolicyNumber() != null
                                ? transfer.getApplication().getPolicyNumber() : "#" + transfer.getApplication().getId()),
                NotificationType.INFO);

        // Notify all admins
        List<User> admins = userRepo.findAllByRole(Role.ADMIN);
        for (User admin : admins) {
            notifService.send(admin,
                    "Policy Transfer Awaiting Approval",
                    String.format("Transfer of policy %s from %s to %s is awaiting your approval.",
                            transfer.getApplication().getPolicyNumber() != null
                                    ? transfer.getApplication().getPolicyNumber() : "#" + transfer.getApplication().getId(),
                            transfer.getFromCustomer().getName(),
                            transfer.getToCustomer().getName()),
                    NotificationType.INFO);
        }

        return ResponseEntity.ok(toDto(transfer));
    }

    // ── Transferee rejects ────────────────────────────────────────────
    @PutMapping("/{id}/reject")
    @Transactional
    public ResponseEntity<?> rejectByTransferee(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody(required = false) Map<String, String> body) {

        User user = getUser(principal);
        PolicyTransfer transfer = transferRepo.findById(id).orElse(null);
        if (transfer == null) return ResponseEntity.notFound().build();
        if (!transfer.getToCustomer().getId().equals(user.getId()))
            return ResponseEntity.status(403).body(Map.of("message", "This transfer is not addressed to you"));
        if (transfer.getStatus() != TransferStatus.PENDING_TRANSFEREE_SIGNATURE)
            return ResponseEntity.badRequest().body(Map.of("message", "This transfer is no longer awaiting your response"));

        transfer.setStatus(TransferStatus.REJECTED);
        transfer.setAdminNote(body != null ? body.get("note") : null);
        transferRepo.save(transfer);

        notifService.send(transfer.getFromCustomer(),
                "Transfer Rejected",
                String.format("%s has declined your transfer request for policy %s.",
                        user.getName(),
                        transfer.getApplication().getPolicyNumber() != null
                                ? transfer.getApplication().getPolicyNumber() : "#" + transfer.getApplication().getId()),
                NotificationType.REJECTION);

        return ResponseEntity.ok(toDto(transfer));
    }

    // ── Serve evidence file ───────────────────────────────────────────
    @GetMapping("/{id}/evidence/{index}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> serveEvidenceFile(
            @PathVariable Long id,
            @PathVariable int index,
            @AuthenticationPrincipal UserDetails principal) {

        User user = getUser(principal);
        PolicyTransfer transfer = transferRepo.findById(id).orElse(null);
        if (transfer == null) return ResponseEntity.notFound().build();
        // Only sender or recipient may view evidence files
        if (!transfer.getFromCustomer().getId().equals(user.getId()) &&
            !transfer.getToCustomer().getId().equals(user.getId()))
            return ResponseEntity.status(403).build();

        List<String> paths = FileStorageUtil.fromJsonArray(transfer.getEvidenceFilesJson());
        if (index < 0 || index >= paths.size()) return ResponseEntity.notFound().build();
        return FileStorageUtil.streamFile(paths.get(index));
    }

    // ── Email validation check ────────────────────────────────────────
    @GetMapping("/check-email")
    @Transactional(readOnly = true)
    public ResponseEntity<?> checkEmail(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam String email) {
        User me = getUser(principal);
        User target = userRepo.findByEmail(email.trim().toLowerCase()).orElse(null);
        if (target == null || target.getRole() != Role.CUSTOMER || !target.isActive()) {
            return ResponseEntity.ok(Map.of("valid", false, "name", ""));
        }
        if (target.getId().equals(me.getId())) {
            return ResponseEntity.ok(Map.of("valid", false, "name", "", "message", "Cannot transfer to yourself"));
        }
        return ResponseEntity.ok(Map.of("valid", true, "name", target.getName()));
    }

    // ── DTO helper ────────────────────────────────────────────────────
    static Map<String, Object> toDto(PolicyTransfer t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", t.getId());

        PolicyApplication app = t.getApplication();
        if (app != null) {
            m.put("applicationId", app.getId());
            m.put("policyNumber", app.getPolicyNumber());
            m.put("packageName", app.getInsurancePackage() != null ? app.getInsurancePackage().getName() : null);
            m.put("packageType", app.getInsurancePackage() != null ? app.getInsurancePackage().getType() : null);
        }

        User from = t.getFromCustomer();
        if (from != null) {
            m.put("fromCustomerId", from.getId());
            m.put("fromCustomerName", from.getName());
            m.put("fromCustomerEmail", from.getEmail());
        }

        User to = t.getToCustomer();
        if (to != null) {
            m.put("toCustomerId", to.getId());
            m.put("toCustomerName", to.getName());
            m.put("toCustomerEmail", to.getEmail());
        }

        m.put("relationship", t.getRelationship());
        m.put("relationshipDetail", t.getRelationshipDetail());
        m.put("reason", t.getReason());

        // Evidence file serving paths (frontend fetches via /customer/policy-transfers/{id}/evidence/{index})
        List<String> evidencePaths = FileStorageUtil.fromJsonArray(t.getEvidenceFilesJson());
        m.put("evidenceFileCount", evidencePaths.size());
        m.put("status", t.getStatus().name());
        m.put("fromSignedAt", t.getFromSignedAt() != null ? t.getFromSignedAt().toString() : null);
        m.put("toSignedAt", t.getToSignedAt() != null ? t.getToSignedAt().toString() : null);
        m.put("adminNote", t.getAdminNote());
        m.put("approvedAt", t.getApprovedAt() != null ? t.getApprovedAt().toString() : null);

        if (t.getApprovedBy() != null) {
            m.put("approvedByName", t.getApprovedBy().getName());
        }

        m.put("createdAt", t.getCreatedAt() != null ? t.getCreatedAt().toString() : null);
        m.put("updatedAt", t.getUpdatedAt() != null ? t.getUpdatedAt().toString() : null);

        // Include signatures for PDF generation (stripped from list views on frontend)
        m.put("fromSignature", t.getFromSignature());
        m.put("toSignature", t.getToSignature());

        return m;
    }
}
