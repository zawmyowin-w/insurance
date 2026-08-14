package com.insurance.portal.service;

import com.insurance.portal.dto.UpdateProfileRequest;
import com.insurance.portal.dto.UserResponse;
import com.insurance.portal.model.User;
import com.insurance.portal.model.enums.Role;
import com.insurance.portal.repository.*;
import com.insurance.portal.util.EmailValidationUtil;
import com.insurance.portal.util.FileStorageUtil;
import com.insurance.portal.util.PasswordValidationUtil;
import com.insurance.portal.util.PhoneValidationUtil;
import com.insurance.portal.util.ApiResponseUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepo;
    private final PolicyApplicationRepository appRepo;
    private final ClaimRepository claimRepo;
    private final PaymentRepository paymentRepo;
    private final NotificationRepository notifRepo;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public ResponseEntity<?> createAgent(Map<String, Object> req) {
        String email = req.get("email").toString();
        if (!EmailValidationUtil.isValid(email))
            return ApiResponseUtil.badRequest(EmailValidationUtil.ERROR_MESSAGE);
        if (userRepo.existsByEmail(email))
            return ApiResponseUtil.badRequest("Email already in use");

        String password = req.get("password").toString();
        if (!PasswordValidationUtil.isStrong(password))
            return ApiResponseUtil.badRequest(PasswordValidationUtil.ERROR_MESSAGE);

        String insuranceType = req.containsKey("insuranceType") ? req.get("insuranceType").toString() : "ALL";
        if (!"ALL".equals(insuranceType)) {
            Optional<User> taken = userRepo.findFirstByRoleAndInsuranceTypeAndActive(Role.AGENT, insuranceType, true);
            if (taken.isPresent())
                return ResponseEntity.status(409).body(Map.of("message",
                    "\"" + taken.get().getName() + "\" သည် " + insuranceType + " type ကို ယူထားပြီးဖြစ်သည်။ Insurance type တစ်မျိုးလျှင် agent တစ်ယောက်သာ ရပါသည်။"));
        }

        String agentPhone = req.containsKey("phone") ? req.get("phone").toString() : null;
        if (agentPhone != null && !agentPhone.isBlank()) {
            String phoneErr = PhoneValidationUtil.validate(agentPhone);
            if (phoneErr != null)
                return ApiResponseUtil.badRequest(phoneErr);
            agentPhone = PhoneValidationUtil.normalize(agentPhone);
            if (userRepo.existsByPhone(agentPhone))
                return ResponseEntity.status(409).body(Map.of("message", PhoneValidationUtil.DUPLICATE_ERROR));
        }

        User agent = User.builder()
                .name(req.get("name").toString())
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(Role.AGENT)
                .phone(agentPhone)
                .address(req.containsKey("address") ? req.get("address").toString() : null)
                .insuranceType(insuranceType)
                .active(true)
                .build();
        return ResponseEntity.ok(UserResponse.from(userRepo.save(agent)));
    }

    @Transactional
    public ResponseEntity<?> createAdmin(Map<String, Object> req) {
        String email = req.get("email").toString();
        if (!EmailValidationUtil.isValid(email))
            return ApiResponseUtil.badRequest(EmailValidationUtil.ERROR_MESSAGE);
        if (userRepo.existsByEmail(email))
            return ApiResponseUtil.badRequest("Email already in use");

        String password = req.get("password").toString();
        if (!PasswordValidationUtil.isStrong(password))
            return ApiResponseUtil.badRequest(PasswordValidationUtil.ERROR_MESSAGE);

        String adminPhone = req.containsKey("phone") ? req.get("phone").toString() : null;
        if (adminPhone != null && !adminPhone.isBlank()) {
            String phoneErr = PhoneValidationUtil.validate(adminPhone);
            if (phoneErr != null)
                return ApiResponseUtil.badRequest(phoneErr);
            adminPhone = PhoneValidationUtil.normalize(adminPhone);
            if (userRepo.existsByPhone(adminPhone))
                return ResponseEntity.status(409).body(Map.of("message", PhoneValidationUtil.DUPLICATE_ERROR));
        }

        User admin = User.builder()
                .name(req.get("name").toString())
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(Role.ADMIN)
                .phone(adminPhone)
                .address(req.containsKey("address") ? req.get("address").toString() : null)
                .active(true)
                .build();
        return ResponseEntity.ok(UserResponse.from(userRepo.save(admin)));
    }

    @Transactional
    public ResponseEntity<?> updateUser(Long id, UpdateProfileRequest req) {
        User user = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));

        if (req.getName() != null && !req.getName().isBlank()) user.setName(req.getName());
        if (req.getEmail() != null && !req.getEmail().isBlank() && !req.getEmail().equalsIgnoreCase(user.getEmail())) {
            if (!EmailValidationUtil.isValid(req.getEmail()))
                return ApiResponseUtil.badRequest(EmailValidationUtil.ERROR_MESSAGE);
            if (userRepo.existsByEmail(req.getEmail()))
                return ApiResponseUtil.badRequest("Email already in use");
            user.setEmail(req.getEmail());
        }
        if (req.getPhone() != null && !req.getPhone().isBlank()) {
            String phoneErr = PhoneValidationUtil.validate(req.getPhone());
            if (phoneErr != null)
                return ApiResponseUtil.badRequest(phoneErr);
            String normalizedPhone = PhoneValidationUtil.normalize(req.getPhone());
            if (userRepo.existsByPhoneAndIdNot(normalizedPhone, id))
                return ResponseEntity.status(409).body(Map.of("message", PhoneValidationUtil.DUPLICATE_ERROR));
            user.setPhone(normalizedPhone);
        }
        if (req.getAddress() != null) user.setAddress(req.getAddress());
        if (user.getRole() == Role.AGENT && req.getInsuranceType() != null && !req.getInsuranceType().isBlank()) {
            String newType = req.getInsuranceType();
            if (!"ALL".equals(newType)) {
                Optional<User> existing = userRepo.findFirstByRoleAndInsuranceTypeAndActive(Role.AGENT, newType, true);
                if (existing.isPresent() && !existing.get().getId().equals(id))
                    return ResponseEntity.status(409).body(Map.of("message",
                        "\"" + existing.get().getName() + "\" သည် " + newType + " type ကို ယူထားပြီးဖြစ်သည်။ Insurance type တစ်မျိုးလျှင် agent တစ်ယောက်သာ ရပါသည်။"));
            }
            user.setInsuranceType(newType);
        }
        if (req.getNewPassword() != null && !req.getNewPassword().isBlank()) {
            if (!PasswordValidationUtil.isStrong(req.getNewPassword()))
                return ApiResponseUtil.badRequest(PasswordValidationUtil.ERROR_MESSAGE);
            user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        }
        return ResponseEntity.ok(UserResponse.from(userRepo.save(user)));
    }

    @Transactional
    public ResponseEntity<?> uploadPicture(Long id, MultipartFile file) {
        User user = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        try {
            String oldPath = user.getProfilePicture();
            String newPath = FileStorageUtil.saveImage(file, "profile-pictures", "user_" + id);
            if (newPath == null)
                return ApiResponseUtil.badRequest("No file provided");
            user.setProfilePicture(newPath);
            userRepo.save(user);
            FileStorageUtil.deleteFileQuietly(oldPath);
            return ResponseEntity.ok(UserResponse.from(user));
        } catch (Exception e) {
            return ApiResponseUtil.badRequest(e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public ResponseEntity<?> getPicture(Long id) {
        User user = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        String path = user.getProfilePicture();
        if (path == null || path.isBlank()) return ResponseEntity.notFound().build();
        return FileStorageUtil.streamFile(path);
    }

    @Transactional
    public ResponseEntity<?> deleteUser(Long id) {
        User user = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        notifRepo.deleteAllByRecipient(user);
        if (user.getRole() == Role.CUSTOMER) {
            paymentRepo.deleteAllByCustomer(user);
            claimRepo.deleteAllByCustomer(user);
            appRepo.deleteAllByCustomer(user);
        } else if (user.getRole() == Role.AGENT) {
            claimRepo.clearAgentFromClaims(user);
            appRepo.clearAgentFromApplications(user);
        }
        userRepo.delete(user);
        return ApiResponseUtil.ok("User deleted");
    }
}
