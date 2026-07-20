package com.insurance.portal.controller;

import com.insurance.portal.dto.ClaimResponse;
import com.insurance.portal.model.Claim;
import com.insurance.portal.model.enums.ClaimStatus;
import com.insurance.portal.repository.ClaimRepository;
import com.insurance.portal.service.AdminClaimService;
import com.insurance.portal.util.FileStorageUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/claims")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminClaimController {

    private final ClaimRepository claimRepo;
    private final AdminClaimService claimService;

    @GetMapping
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

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable Long id, @RequestBody Map<String, String> req) {
        return claimService.approve(id, req.get("note"));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable Long id, @RequestBody Map<String, String> req) {
        return claimService.reject(id, req.get("note"));
    }

    @PutMapping("/{id}/revise")
    public ResponseEntity<?> revise(@PathVariable Long id, @RequestBody Map<String, String> req) {
        return claimService.revise(id, req.get("note"));
    }

    @GetMapping("/{id}/form-file/{fieldId}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getFormFile(@PathVariable Long id, @PathVariable String fieldId) {
        Claim claim = claimRepo.findById(id).orElseThrow();
        return FileStorageUtil.serveFormFile(claim.getFormData(), fieldId);
    }
}
