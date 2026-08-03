package com.insurance.portal.controller;

import com.insurance.portal.dto.ApplicationResponse;
import com.insurance.portal.dto.UpdateProfileRequest;
import com.insurance.portal.dto.UserResponse;
import com.insurance.portal.model.User;
import com.insurance.portal.model.enums.Role;
import com.insurance.portal.repository.ClaimRepository;
import com.insurance.portal.repository.PaymentRepository;
import com.insurance.portal.repository.PolicyApplicationRepository;
import com.insurance.portal.repository.UserRepository;
import com.insurance.portal.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepo;
    private final AdminUserService userService;
    private final PolicyApplicationRepository appRepo;
    private final ClaimRepository claimRepo;
    private final PaymentRepository paymentRepo;

    @GetMapping
    @Transactional(readOnly = true)
    public List<UserResponse> getUsers() {
        return userRepo.findAll().stream().map(UserResponse::from).toList();
    }

    @PostMapping("/agents")
    public ResponseEntity<?> createAgent(@RequestBody Map<String, Object> req) {
        return userService.createAgent(req);
    }

    @PostMapping("/admins")
    public ResponseEntity<?> createAdmin(@RequestBody Map<String, Object> req) {
        return userService.createAdmin(req);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody UpdateProfileRequest req) {
        return userService.updateUser(id, req);
    }

    @PostMapping(value = "/{id}/picture", consumes = "multipart/form-data")
    public ResponseEntity<?> uploadPicture(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return userService.uploadPicture(id, file);
    }

    @GetMapping("/{id}/picture")
    public ResponseEntity<?> getPicture(@PathVariable Long id) throws java.io.IOException {
        return userService.getPicture(id);
    }

    @PutMapping("/{id}/toggle")
    @Transactional
    public ResponseEntity<?> toggleUser(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        User user = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setActive(Boolean.TRUE.equals(req.get("active")));
        return ResponseEntity.ok(UserResponse.from(userRepo.save(user)));
    }

    /**
     * Returns a summary of all data associated with a user before deletion.
     * Used by admin to review what will be removed.
     */
    @GetMapping("/{id}/summary")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getUserSummary(@PathVariable Long id) {
        User user = userRepo.findById(id).orElse(null);
        if (user == null) return ResponseEntity.notFound().build();

        java.util.Map<String, Object> summary = new java.util.LinkedHashMap<>();
        summary.put("id", user.getId());
        summary.put("name", user.getName());
        summary.put("email", user.getEmail());
        summary.put("role", user.getRole().name());
        summary.put("active", user.isActive());
        summary.put("joinedAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);

        if (user.getRole() == Role.CUSTOMER) {
            var apps = appRepo.findAllByCustomer(user);
            summary.put("applicationCount", apps.size());
            summary.put("applications", apps.stream().limit(5).map(a -> {
                java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
                m.put("id", a.getId());
                m.put("policyNumber", a.getPolicyNumber());
                m.put("packageName", a.getInsurancePackage() != null ? a.getInsurancePackage().getName() : null);
                m.put("status", a.getStatus().name());
                m.put("createdAt", a.getCreatedAt() != null ? a.getCreatedAt().toLocalDate().toString() : null);
                return m;
            }).toList());

            var claims = claimRepo.findAllByCustomer(user);
            summary.put("claimCount", claims.size());
            summary.put("claims", claims.stream().limit(5).map(c -> {
                java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
                m.put("id", c.getId());
                m.put("amount", c.getAmount());
                m.put("status", c.getStatus().name());
                m.put("createdAt", c.getCreatedAt() != null ? c.getCreatedAt().toLocalDate().toString() : null);
                return m;
            }).toList());

            var payments = paymentRepo.findAllByCustomer(user);
            summary.put("paymentCount", payments.size());
        } else if (user.getRole() == Role.AGENT) {
            var apps = appRepo.findAllByAgent(user);
            summary.put("assignedApplicationCount", apps.size());
            summary.put("assignedApplications", apps.stream().limit(5).map(a -> {
                java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
                m.put("id", a.getId());
                m.put("policyNumber", a.getPolicyNumber());
                m.put("customerName", a.getCustomer() != null ? a.getCustomer().getName() : null);
                m.put("status", a.getStatus().name());
                return m;
            }).toList());
        }
        return ResponseEntity.ok(summary);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        return userService.deleteUser(id);
    }
}
