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
    @NotBlank @Email
    @Pattern(regexp = "^[a-z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
            message = "Email must start with a lowercase letter — it cannot begin with a capital letter or a number")
    private String email;
    @NotBlank @Size(min = 8)
    private String password;
    private String phone;
    private String address;
}
