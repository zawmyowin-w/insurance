package com.insurance.portal.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    private String name;

    /**
     * Email — any real domain accepted (not Gmail-only).
     * Username: 6–30 chars, a-z / 0-9 / . / _ / -, must start and end with letter or digit.
     * Domain:   any domain with a valid TLD (2–6 letters).
     *
     * Full rules (consecutive/mixed special chars, reserved usernames, disposable
     * domains, MX check) are enforced in EmailValidationUtil + EmailValidationService.
     * This @Pattern is a lightweight safety net at the DTO layer only.
     *
     * Max total length: username(30) + @(1) + domain(~60) = 100 chars.
     */
    @NotBlank @Email
    @Size(max = 100, message = "Email must not exceed 100 characters")
    @Pattern(
        regexp = "^[a-z0-9][a-z0-9._-]{4,28}[a-z0-9]@[a-z0-9][a-z0-9.-]+\\.[a-z]{2,6}$|^[a-z0-9]{6,30}@[a-z0-9][a-z0-9.-]+\\.[a-z]{2,6}$",
        message = "Please enter a valid email address (lowercase, valid domain, 6-30 char username)"
    )
    private String email;

    // Full strength check is applied in AuthController; @Size here is a safety net
    @NotBlank @Size(min = 8)
    private String password;

    private String phone;
    private String address;

    /**
     * Honeypot field — must be absent or empty.
     * Real users never see or interact with this field; bots commonly fill it in.
     */
    private String website;
}
