package com.insurance.portal.controller;

import com.insurance.portal.dto.*;
import com.insurance.portal.model.User;
import com.insurance.portal.model.enums.Role;
import com.insurance.portal.repository.UserRepository;
import com.insurance.portal.security.JwtTokenProvider;
import com.insurance.portal.service.EmailValidationService;
import com.insurance.portal.util.EmailValidationUtil;
import com.insurance.portal.util.NameValidationUtil;
import com.insurance.portal.util.PhoneValidationUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.insurance.portal.util.FileStorageUtil;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final EmailValidationService emailValidationService;

    // ── Rate limiting (in-memory, per IP) ────────────────────────────────────
    // Registration: max 10 attempts per IP per 15 minutes
    // Email validation: max 30 calls per IP per 15 minutes
    private static final ConcurrentHashMap<String, List<Long>> REG_ATTEMPTS   = new ConcurrentHashMap<>();
    private static final ConcurrentHashMap<String, List<Long>> VALID_ATTEMPTS = new ConcurrentHashMap<>();
    private static final int  REG_MAX      = 10;
    private static final int  VALID_MAX    = 30;
    private static final long WINDOW_MS    = 15 * 60_000L;

    private String clientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        return (xff != null && !xff.isBlank()) ? xff.split(",")[0].trim() : req.getRemoteAddr();
    }

    /** Returns true and records attempt if under limit; returns false if rate-limited. */
    private boolean checkRateLimit(ConcurrentHashMap<String, List<Long>> store, String key, int max) {
        long now = System.currentTimeMillis();
        List<Long> times = store.compute(key, (k, list) -> {
            if (list == null) list = new ArrayList<>();
            list.removeIf(t -> now - t > WINDOW_MS);
            return list;
        });
        if (times.size() >= max) return false;
        times.add(now);
        return true;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
        String token = tokenProvider.generateToken(req.getEmail());
        User user = userRepository.findByEmail(req.getEmail()).orElseThrow();
        return ResponseEntity.ok(new AuthResponse(token, UserResponse.from(user)));
    }

    /**
     * Full server-side email validation (Rules 1-17 + MX record check, Rules 18-19).
     * Called by the frontend before check-email / OTP issue.
     * Rate-limited to 30 calls per IP per 15 minutes (Rule 31).
     */
    @GetMapping("/validate-email")
    public ResponseEntity<?> validateEmail(@RequestParam String email,
                                           HttpServletRequest request) {
        // Rate limit
        String ip = clientIp(request);
        if (!checkRateLimit(VALID_ATTEMPTS, ip, VALID_MAX)) {
            log.warn("[RateLimit] validate-email blocked for IP: {}", ip);
            return ResponseEntity.status(429).body(new ErrorResponse(
                "Too many requests. Please wait a few minutes before trying again."));
        }

        // Normalize (Rules 3, 12)
        String normalized = EmailValidationUtil.normalize(email);

        // Full format + blacklist validation (Rules 1-17)
        EmailValidationService.Result result = emailValidationService.validate(normalized);
        if (!result.valid()) {
            return ResponseEntity.badRequest().body(new ErrorResponse(result.errorMessage()));
        }

        return ResponseEntity.ok(Map.of("valid", true, "normalizedEmail", normalized));
    }

    /** Check whether an email address is available (not yet registered). */
    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestParam String email) {
        // Normalize before lookup (Rule 12)
        String normalized = EmailValidationUtil.normalize(email);
        if (userRepository.existsByEmail(normalized)) {
            return ResponseEntity.status(409).body(new ErrorResponse("Email already in use"));
        }
        return ResponseEntity.ok(Map.of("available", true));
    }

    /**
     * Create a verified customer account.
     *
     * Security controls applied here (Rules 21-22, 30-34):
     *   - Honeypot field check (Rule 30): 'website' must be absent/empty
     *   - Rate limiting (Rule 31): max 10 registration attempts per IP per 15 min
     *   - Email normalization (Rule 12): toLowerCase + trim
     *   - Email uniqueness (Rules 21-22): DB unique constraint + pre-check
     *   - Full Gmail validation (Rules 1-17): via EmailValidationUtil
     *   - SQL injection (Rule 32): JPA parameterized queries — never raw SQL
     *   - XSS (Rule 33): no HTML rendered from stored user input; sanitized at presentation layer
     *   - Account activated immediately on registration (Rule 40): active = true
     *     (account was OTP-verified by the frontend before reaching this endpoint)
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req,
                                      HttpServletRequest request) {
        // Rule 30: Honeypot — bots fill in the 'website' field; real users don't
        if (req.getWebsite() != null && !req.getWebsite().isBlank()) {
            log.warn("[Honeypot] Bot registration detected from IP: {}", clientIp(request));
            // Return a neutral 400 — don't reveal what triggered it
            return ResponseEntity.badRequest().body(new ErrorResponse("Invalid request"));
        }

        // Rule 31: Rate limiting
        String ip = clientIp(request);
        if (!checkRateLimit(REG_ATTEMPTS, ip, REG_MAX)) {
            log.warn("[RateLimit] register blocked for IP: {}", ip);
            return ResponseEntity.status(429).body(new ErrorResponse(
                "Too many registration attempts. Please wait 15 minutes and try again."));
        }

        // Rules 12, 3: Normalize email
        String email = EmailValidationUtil.normalize(req.getEmail());

        // Rules 1-17: Full Gmail validation (safety net — frontend also validates)
        String validationError = EmailValidationUtil.validate(email);
        if (validationError != null) {
            return ResponseEntity.badRequest().body(new ErrorResponse(validationError));
        }

        // Full name validation — name must be real text, not a number or special-character string.
        String nameError = NameValidationUtil.validate(req.getName());
        if (nameError != null) {
            return ResponseEntity.badRequest().body(new ErrorResponse(nameError));
        }
        String name = NameValidationUtil.normalize(req.getName());

        // Rules 21-22: Uniqueness check
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(409).body(new ErrorResponse("Email already in use"));
        }

        // Phone validation
        String phone = req.getPhone();
        if (phone != null && !phone.isBlank()) {
            String phoneError = PhoneValidationUtil.validate(phone);
            if (phoneError != null) {
                return ResponseEntity.badRequest().body(new ErrorResponse(phoneError));
            }
            phone = PhoneValidationUtil.normalize(phone);
            if (userRepository.existsByPhone(phone)) {
                return ResponseEntity.status(409).body(new ErrorResponse(PhoneValidationUtil.DUPLICATE_ERROR));
            }
        } else {
            return ResponseEntity.badRequest().body(new ErrorResponse(PhoneValidationUtil.REQUIRED_ERROR));
        }

        // Rule 40: Account is activated immediately — OTP verification was completed on the frontend
        User user = User.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(req.getPassword()))
                .role(Role.CUSTOMER)
                .phone(phone)
                .address(req.getAddress())
                .active(true)
                .build();
        userRepository.save(user);
        log.info("[Auth] New customer registered: {}", email);
        String token = tokenProvider.generateToken(user.getEmail());
        return ResponseEntity.ok(new AuthResponse(token, UserResponse.from(user)));
    }

    @PostMapping("/google")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> body) {
        String accessToken = body.get("accessToken");
        if (accessToken == null || accessToken.isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Missing Google access token"));
        }

        // Verify token and fetch profile from Google
        Map<String, String> info;
        try {
            RestTemplate restTemplate = new RestTemplate();
            info = restTemplate.getForObject(
                "https://www.googleapis.com/oauth2/v3/userinfo?access_token=" + accessToken,
                Map.class
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Invalid or expired Google token"));
        }

        if (info == null || info.get("email") == null) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Could not retrieve Google account info"));
        }

        String email = info.get("email");
        String name  = info.getOrDefault("name", email.split("@")[0]);

        // Find existing user or create a new CUSTOMER account
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                    .name(name)
                    .email(email)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role(Role.CUSTOMER)
                    .active(true)
                    .build();
            return userRepository.save(newUser);
        });

        String token = tokenProvider.generateToken(user.getEmail());
        return ResponseEntity.ok(new AuthResponse(token, UserResponse.from(user)));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserDetails principal) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        return ResponseEntity.ok(UserResponse.from(user));
    }

    /**
     * Self-service profile update.
     * - ADMIN: may edit name, email, phone, address, and password.
     * - CUSTOMER: name/email are locked (core identity fields) — phone,
     *   address, and password may be changed here.
     * - AGENT: not allowed to self-edit; only an admin can update an agent's
     *   profile (see AdminController#updateUser).
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal UserDetails principal,
                                            @RequestBody UpdateProfileRequest req) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();

        if (user.getRole() == Role.AGENT) {
            return ResponseEntity.status(403).body(new ErrorResponse(
                    "Agent profiles can only be updated by an admin. Please contact your administrator."));
        }

        // Phone validation helper (shared by ADMIN and CUSTOMER paths)
        if (req.getPhone() != null && !req.getPhone().isBlank()) {
            String phoneErr = PhoneValidationUtil.validate(req.getPhone());
            if (phoneErr != null) {
                return ResponseEntity.badRequest().body(new ErrorResponse(phoneErr));
            }
            String normalizedPhone = PhoneValidationUtil.normalize(req.getPhone());
            if (userRepository.existsByPhoneAndIdNot(normalizedPhone, user.getId())) {
                return ResponseEntity.status(409).body(new ErrorResponse(PhoneValidationUtil.DUPLICATE_ERROR));
            }
            req.setPhone(normalizedPhone);
        }

        if (user.getRole() == Role.ADMIN) {
            if (req.getName() != null && !req.getName().isBlank()) user.setName(req.getName());
            if (req.getEmail() != null && !req.getEmail().isBlank() && !req.getEmail().equalsIgnoreCase(user.getEmail())) {
                if (!com.insurance.portal.util.EmailValidationUtil.isValid(req.getEmail())) {
                    return ResponseEntity.badRequest().body(new ErrorResponse(com.insurance.portal.util.EmailValidationUtil.ERROR_MESSAGE));
                }
                if (userRepository.existsByEmail(req.getEmail())) {
                    return ResponseEntity.badRequest().body(new ErrorResponse("Email already in use"));
                }
                user.setEmail(req.getEmail());
            }
            if (req.getPhone() != null && !req.getPhone().isBlank()) user.setPhone(req.getPhone());
            if (req.getAddress() != null) user.setAddress(req.getAddress());
        } else {
            // CUSTOMER — name and email are locked (core identity); phone, address
            // (and password below) may change.
            if (req.getPhone() != null && !req.getPhone().isBlank()) user.setPhone(req.getPhone());
            if (req.getAddress() != null) user.setAddress(req.getAddress());
        }

        if (req.getNewPassword() != null && !req.getNewPassword().isBlank()) {
            if (req.getCurrentPassword() == null || !passwordEncoder.matches(req.getCurrentPassword(), user.getPassword())) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Current password is incorrect"));
            }
            if (!com.insurance.portal.util.PasswordValidationUtil.isStrong(req.getNewPassword())) {
                return ResponseEntity.badRequest().body(new ErrorResponse(com.insurance.portal.util.PasswordValidationUtil.ERROR_MESSAGE));
            }
            user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        }

        userRepository.save(user);
        return ResponseEntity.ok(UserResponse.from(user));
    }

    /**
     * Change the current user's password via the "forgot password" email-OTP
     * flow instead of re-entering the current password. The OTP itself is
     * generated/verified client-side (same trust model as the public
     * forgot-password flow) — this endpoint only requires the caller to
     * already be authenticated as the account holder, and applies the same
     * role rule as {@link #updateProfile}: agents cannot self-edit.
     */
    @PutMapping("/profile/password-otp")
    public ResponseEntity<?> changePasswordViaOtp(@AuthenticationPrincipal UserDetails principal,
                                                    @RequestBody Map<String, String> body) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        if (user.getRole() == Role.AGENT) {
            return ResponseEntity.status(403).body(new ErrorResponse(
                    "Agent profiles can only be updated by an admin. Please contact your administrator."));
        }
        String newPassword = body.get("newPassword");
        if (!com.insurance.portal.util.PasswordValidationUtil.isStrong(newPassword)) {
            return ResponseEntity.badRequest().body(new ErrorResponse(com.insurance.portal.util.PasswordValidationUtil.ERROR_MESSAGE));
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok(UserResponse.from(user));
    }

    /**
     * Upload/replace the current user's own profile picture.
     * ADMIN and CUSTOMER only — agents cannot self-edit (see updateProfile above).
     */
    @PostMapping(value = "/profile/picture", consumes = "multipart/form-data")
    public ResponseEntity<?> uploadOwnPicture(@AuthenticationPrincipal UserDetails principal,
                                               @RequestParam("file") MultipartFile file) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        if (user.getRole() == Role.AGENT) {
            return ResponseEntity.status(403).body(new ErrorResponse(
                    "Agent profiles can only be updated by an admin. Please contact your administrator."));
        }
        try {
            String oldPath = user.getProfilePicture();
            String newPath = FileStorageUtil.saveImage(file, "profile-pictures", "user_" + user.getId());
            if (newPath == null) {
                return ResponseEntity.badRequest().body(new ErrorResponse("No file provided"));
            }
            user.setProfilePicture(newPath);
            userRepository.save(user);
            FileStorageUtil.deleteFileQuietly(oldPath);
            return ResponseEntity.ok(UserResponse.from(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /** Stream the current user's own profile picture. */
    @GetMapping("/profile/picture")
    public ResponseEntity<?> getOwnPicture(@AuthenticationPrincipal UserDetails principal) throws IOException {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        String path = user.getProfilePicture();
        if (path == null || path.isBlank()) {
            return ResponseEntity.notFound().build();
        }
        return FileStorageUtil.streamFile(path);
    }

    record ErrorResponse(String message) {}
}
