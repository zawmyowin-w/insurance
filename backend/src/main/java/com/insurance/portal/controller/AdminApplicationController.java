package com.insurance.portal.controller;

import com.insurance.portal.dto.ApplicationResponse;
import com.insurance.portal.model.PolicyApplication;
import com.insurance.portal.model.enums.ApplicationStatus;
import com.insurance.portal.repository.PaymentRepository;
import com.insurance.portal.repository.PolicyApplicationRepository;
import com.insurance.portal.service.AdminApplicationService;
import com.insurance.portal.util.FileStorageUtil;
import com.insurance.portal.util.PremiumScheduleUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/applications")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminApplicationController {

    private final PolicyApplicationRepository appRepo;
    private final PaymentRepository paymentRepo;
    private final AdminApplicationService appService;

    @GetMapping
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

    @GetMapping("/{id}/schedule")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getSchedule(@PathVariable Long id) {
        PolicyApplication app = appRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        return ResponseEntity.ok(PremiumScheduleUtil.buildSchedule(app, paymentRepo.findAllByApplication_Id(id)));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable Long id, @RequestBody Map<String, String> req) {
        return appService.approve(id, req.get("note"));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable Long id, @RequestBody Map<String, String> req) {
        return appService.reject(id, req.get("note"));
    }

    @PutMapping("/{id}/revise")
    public ResponseEntity<?> revise(@PathVariable Long id, @RequestBody Map<String, String> req) {
        return appService.revise(id, req.get("note"));
    }

    @GetMapping("/{id}/form-file/{fieldId}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getFormFile(@PathVariable Long id, @PathVariable String fieldId) {
        PolicyApplication app = appRepo.findById(id).orElseThrow();
        return FileStorageUtil.serveFormFile(app.getFormData(), fieldId);
    }
}
