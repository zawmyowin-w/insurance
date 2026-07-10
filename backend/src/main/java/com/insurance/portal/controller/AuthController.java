package com.insurance.portal.controller;

import com.insurance.portal.dto.*;
import com.insurance.portal.model.User;
import com.insurance.portal.model.enums.Role;
import com.insurance.portal.repository.UserRepository;
import com.insurance.portal.security.JwtTokenProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
        String token = tokenProvider.generateToken(req.getEmail());
        User user = userRepository.findByEmail(req.getEmail()).orElseThrow();
        return ResponseEntity.ok(new AuthResponse(token, UserResponse.from(user)));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Email already in use"));
        }
        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(Role.CUSTOMER)
                .phone(req.getPhone())
                .address(req.getAddress())
                .active(true)
                .build();
        userRepository.save(user);
        String token = tokenProvider.generateToken(user.getEmail());
        return ResponseEntity.ok(new AuthResponse(token, UserResponse.from(user)));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserDetails principal) {
        User user = userRepository.findByEmail(principal.getUsername()).orElseThrow();
        return ResponseEntity.ok(UserResponse.from(user));
    }

    record ErrorResponse(String message) {}
}
