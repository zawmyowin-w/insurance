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
     * Username: valid email characters, with no arbitrary length limit.
     * Domain:   any domain with a valid TLD (at least 2 letters).
     *
     * Full rules (consecutive/mixed special chars, reserved usernames, disposable
     * domains, MX check) are enforced in EmailValidationUtil + EmailValidationService.
     * This @Pattern is a lightweight safety net at the DTO layer only.
     *
     */
    @NotBlank @Email
    @Pattern(
        regexp = "^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\\.[a-z]{2,}$",
        message = "Please enter a valid email address (lowercase, valid domain)"
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
