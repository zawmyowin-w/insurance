package com.insurance.portal.service;

import com.insurance.portal.dto.ApplicationResponse;
import com.insurance.portal.model.PolicyApplication;
import com.insurance.portal.model.enums.ApplicationStatus;
import com.insurance.portal.model.enums.NotificationType;
import com.insurance.portal.repository.PolicyApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminApplicationService {

    private final PolicyApplicationRepository appRepo;
    private final NotificationService notifService;

    @Transactional
    public ResponseEntity<?> approve(Long id, String note) {
        PolicyApplication app = appRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        if (app.getStatus() != ApplicationStatus.VERIFIED)
            return ResponseEntity.badRequest().body(Map.of("message", "Only VERIFIED applications can be approved"));
        app.setStatus(ApplicationStatus.APPROVED);
        app.setAdminNote(note);
        appRepo.save(app);
        notifService.send(app.getCustomer(),
                "Application Approved! 🎉",
                "Your application for " + app.getInsurancePackage().getName()
                        + " has been approved. Please proceed with payment to activate your policy.",
                NotificationType.APPROVAL);
        return ResponseEntity.ok(ApplicationResponse.from(app));
    }

    @Transactional
    public ResponseEntity<?> reject(Long id, String note) {
        PolicyApplication app = appRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        app.setStatus(ApplicationStatus.REJECTED);
        app.setAdminNote(note);
        appRepo.save(app);
        notifService.send(app.getCustomer(),
                "Application Rejected",
                "Your application for " + app.getInsurancePackage().getName()
                        + " was rejected. Reason: " + (note != null ? note : "N/A"),
                NotificationType.REJECTION);
        return ResponseEntity.ok(ApplicationResponse.from(app));
    }

    @Transactional
    public ResponseEntity<?> revise(Long id, String note) {
        PolicyApplication app = appRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        app.setStatus(ApplicationStatus.REVISION_REQUESTED);
        app.setAdminNote(note);
        app.setRevisionDeadline(LocalDateTime.now().plusDays(7));
        appRepo.save(app);
        notifService.send(app.getCustomer(),
                "Revision Required for Your Application",
                "Your application requires changes: " + (note != null ? note : "N/A")
                        + ". Please update within 7 days.",
                NotificationType.INFO);
        return ResponseEntity.ok(ApplicationResponse.from(app));
    }
}
