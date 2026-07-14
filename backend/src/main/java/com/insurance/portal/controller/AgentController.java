package com.insurance.portal.controller;

import com.insurance.portal.dto.*;
import com.insurance.portal.model.*;
import com.insurance.portal.model.enums.*;
import com.insurance.portal.repository.*;
import com.insurance.portal.util.FileStorageUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.*;

@RestController
@RequestMapping("/agent")
@RequiredArgsConstructor
public class AgentController {

    private final UserRepository userRepo;
    private final PolicyApplicationRepository appRepo;
    private final ClaimRepository claimRepo;
    private final NotificationRepository notifRepo;

    private User getAgent(UserDetails principal) {
        return userRepo.findByEmail(principal.getUsername()).orElseThrow();
    }

    @GetMapping("/dashboard/stats")
    @Transactional(readOnly = true)
    public Map<String, Object> getStats(@AuthenticationPrincipal UserDetails principal) {
        User agent = getAgent(principal);
        Map<String, Object> stats = new HashMap<>();
        stats.put("pending", appRepo.findAllByAgentAndStatus(agent, ApplicationStatus.PENDING).size());
        stats.put("verified", appRepo.findAllByAgentAndStatus(agent, ApplicationStatus.VERIFIED).size());
        stats.put("pendingClaims", claimRepo.findAllByAgentAndStatus(agent, ClaimStatus.PENDING).size());
        stats.put("verifiedClaims", claimRepo.findAllByAgentAndStatus(agent, ClaimStatus.VERIFIED).size());
        return stats;
    }

    @GetMapping("/applications")
    @Transactional(readOnly = true)
    public List<ApplicationResponse> getApplications(@AuthenticationPrincipal UserDetails principal,
                                                      @RequestParam(required = false) Integer limit) {
        User agent = getAgent(principal);
        return appRepo.findAllByAgent(agent).stream()
                .filter(a -> a.getStatus() == ApplicationStatus.PENDING || a.getStatus() == ApplicationStatus.REVISION_REQUESTED)
                .sorted(Comparator.comparing(PolicyApplication::getCreatedAt).reversed())
                .limit(limit != null ? limit : Long.MAX_VALUE)
                .map(ApplicationResponse::from).toList();
    }

    @PutMapping("/applications/{id}/verify")
    @Transactional
    public ResponseEntity<?> verifyApplication(@PathVariable Long id,
                                               @RequestBody Map<String, String> req,
                                               @AuthenticationPrincipal UserDetails principal) {
        User agent = getAgent(principal);
        PolicyApplication app = appRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        // Ownership check
        if (app.getAgent() == null || !app.getAgent().getId().equals(agent.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "You are not assigned to this application"));
        }
        if (app.getStatus() != ApplicationStatus.PENDING && app.getStatus() != ApplicationStatus.REVISION_REQUESTED) {
            return ResponseEntity.badRequest().body(Map.of("message", "Application is not in a verifiable state"));
        }
        app.setStatus(ApplicationStatus.VERIFIED);
        app.setAgentNote(req.get("note"));
        return ResponseEntity.ok(ApplicationResponse.from(appRepo.save(app)));
    }

    @PutMapping("/applications/{id}/reject")
    @Transactional
    public ResponseEntity<?> rejectApplication(@PathVariable Long id,
                                               @RequestBody Map<String, String> req,
                                               @AuthenticationPrincipal UserDetails principal) {
        User agent = getAgent(principal);
        PolicyApplication app = appRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        // Ownership check
        if (app.getAgent() == null || !app.getAgent().getId().equals(agent.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "You are not assigned to this application"));
        }
        if (app.getStatus() != ApplicationStatus.PENDING && app.getStatus() != ApplicationStatus.REVISION_REQUESTED) {
            return ResponseEntity.badRequest().body(Map.of("message", "Application cannot be rejected at this stage"));
        }
        app.setStatus(ApplicationStatus.REJECTED);
        app.setAgentNote(req.get("note"));
        appRepo.save(app);
        notifRepo.save(Notification.builder()
                .recipient(app.getCustomer())
                .title("Application Rejected")
                .message("Your application for " + app.getInsurancePackage().getName()
                        + " was rejected. Reason: " + req.getOrDefault("note", "N/A"))
                .type(NotificationType.REJECTION)
                .build());
        return ResponseEntity.ok(ApplicationResponse.from(app));
    }

    @GetMapping("/claims")
    @Transactional(readOnly = true)
    public List<ClaimResponse> getClaims(@AuthenticationPrincipal UserDetails principal) {
        User agent = getAgent(principal);
        return claimRepo.findAllByAgent(agent).stream()
                .filter(c -> c.getStatus() == ClaimStatus.PENDING || c.getStatus() == ClaimStatus.REVISION_REQUESTED)
                .sorted(Comparator.comparing(Claim::getCreatedAt).reversed())
                .map(ClaimResponse::from).toList();
    }

    @PutMapping("/claims/{id}/verify")
    @Transactional
    public ResponseEntity<?> verifyClaim(@PathVariable Long id,
                                         @RequestBody Map<String, String> req,
                                         @AuthenticationPrincipal UserDetails principal) {
        User agent = getAgent(principal);
        Claim claim = claimRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Claim not found"));
        // Ownership check
        if (claim.getAgent() == null || !claim.getAgent().getId().equals(agent.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "You are not assigned to this claim"));
        }
        if (claim.getStatus() != ClaimStatus.PENDING && claim.getStatus() != ClaimStatus.REVISION_REQUESTED) {
            return ResponseEntity.badRequest().body(Map.of("message", "Claim is not in a verifiable state"));
        }
        claim.setStatus(ClaimStatus.VERIFIED);
        claim.setAgentNote(req.get("note"));
        return ResponseEntity.ok(ClaimResponse.from(claimRepo.save(claim)));
    }

    @PutMapping("/claims/{id}/reject")
    @Transactional
    public ResponseEntity<?> rejectClaim(@PathVariable Long id,
                                         @RequestBody Map<String, String> req,
                                         @AuthenticationPrincipal UserDetails principal) {
        User agent = getAgent(principal);
        Claim claim = claimRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Claim not found"));
        // Ownership check
        if (claim.getAgent() == null || !claim.getAgent().getId().equals(agent.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "You are not assigned to this claim"));
        }
        if (claim.getStatus() != ClaimStatus.PENDING && claim.getStatus() != ClaimStatus.REVISION_REQUESTED) {
            return ResponseEntity.badRequest().body(Map.of("message", "Claim cannot be rejected at this stage"));
        }
        claim.setStatus(ClaimStatus.REJECTED);
        claim.setAgentNote(req.get("note"));
        claimRepo.save(claim);
        notifRepo.save(Notification.builder()
                .recipient(claim.getCustomer())
                .title("Claim Rejected")
                .message("Your claim of " + claim.getAmount() + " MMK was rejected. Reason: "
                        + req.getOrDefault("note", "N/A"))
                .type(NotificationType.REJECTION)
                .build());
        return ResponseEntity.ok(ClaimResponse.from(claim));
    }

    // ── Document viewing (application supporting docs & claim evidence) ─
    @GetMapping("/applications/{id}/documents/{index}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getApplicationDocument(@PathVariable Long id, @PathVariable int index,
                                                    @AuthenticationPrincipal UserDetails principal) {
        User agent = getAgent(principal);
        PolicyApplication app = appRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        if (app.getAgent() == null || !app.getAgent().getId().equals(agent.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "You are not assigned to this application"));
        }
        List<String> docs = FileStorageUtil.fromJsonArray(app.getDocumentsPath());
        if (index < 0 || index >= docs.size()) return ResponseEntity.notFound().build();
        return streamFile(docs.get(index));
    }

    @GetMapping("/claims/{id}/documents/{index}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getClaimDocument(@PathVariable Long id, @PathVariable int index,
                                              @AuthenticationPrincipal UserDetails principal) {
        User agent = getAgent(principal);
        Claim claim = claimRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Claim not found"));
        if (claim.getAgent() == null || !claim.getAgent().getId().equals(agent.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "You are not assigned to this claim"));
        }
        List<String> docs = FileStorageUtil.fromJsonArray(claim.getDocumentsPath());
        if (index < 0 || index >= docs.size()) return ResponseEntity.notFound().build();
        return streamFile(docs.get(index));
    }

    /** Serve a file uploaded into a dynamic form field for an application */
    @GetMapping("/applications/{id}/form-file/{fieldId}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getApplicationFormFile(@PathVariable Long id, @PathVariable String fieldId,
            @AuthenticationPrincipal UserDetails principal) {
        User agent = getAgent(principal);
        PolicyApplication app = appRepo.findById(id).orElseThrow();
        if (app.getAgent() == null || !app.getAgent().getId().equals(agent.getId()))
            return ResponseEntity.status(403).build();
        return serveFormFile(app.getFormData(), fieldId);
    }

    /** Serve a file uploaded into a dynamic form field for a claim */
    @GetMapping("/claims/{id}/form-file/{fieldId}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getClaimFormFile(@PathVariable Long id, @PathVariable String fieldId,
            @AuthenticationPrincipal UserDetails principal) {
        User agent = getAgent(principal);
        Claim claim = claimRepo.findById(id).orElseThrow();
        if (claim.getAgent() == null || !claim.getAgent().getId().equals(agent.getId()))
            return ResponseEntity.status(403).build();
        return serveFormFile(claim.getFormData(), fieldId);
    }

    private ResponseEntity<?> streamFile(String path) {
        File file = new File(path);
        if (!file.exists()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(FileStorageUtil.contentTypeFor(path)))
                .body(new FileSystemResource(file));
    }

    @SuppressWarnings("unchecked")
    private ResponseEntity<?> serveFormFile(String formDataJson, String fieldId) {
        if (formDataJson == null) return ResponseEntity.notFound().build();
        try {
            Map<String, Object> data = new com.fasterxml.jackson.databind.ObjectMapper().readValue(formDataJson, Map.class);
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

    @GetMapping("/notifications")
    @Transactional(readOnly = true)
    public List<?> getNotifications(@AuthenticationPrincipal UserDetails principal) {
        User agent = getAgent(principal);
        return notifRepo.findAllByRecipientOrderByCreatedAtDesc(agent).stream().map(n -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", n.getId()); m.put("title", n.getTitle()); m.put("message", n.getMessage());
            m.put("type", n.getType().name()); m.put("read", n.isRead()); m.put("createdAt", n.getCreatedAt());
            return m;
        }).toList();
    }
}
