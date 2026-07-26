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
     * Gmail-only.
     * Username: 6–30 chars, a-z / 0-9 / dots, must start and end with letter or digit.
     * Domain:   exactly gmail.com (lowercase, already normalized by the time it arrives).
     *
     * Full rules (leading/trailing/consecutive dots, blacklist, MX) are enforced
     * in EmailValidationService and EmailValidationUtil — the pattern here is a
     * lightweight safety net at the DTO layer.
     *
     * Max total length: username(30) + @gmail.com(10) = 40 chars.
     */
    @NotBlank @Email
    @Size(max = 40, message = "Email must not exceed 40 characters")
    @Pattern(
        regexp = "^[a-z0-9][a-z0-9.]{4,28}[a-z0-9]@gmail\\.com$|^[a-z0-9]{6,7}@gmail\\.com$",
        message = "Only valid Gmail addresses (@gmail.com) are accepted"
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
