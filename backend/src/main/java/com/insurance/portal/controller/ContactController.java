package com.insurance.portal.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class ContactController {

    @PostMapping("/contact")
    public ResponseEntity<?> contact(@RequestBody Map<String, String> req) {
        // In production: save to DB or send email
        System.out.println("📧 Contact form: " + req.get("name") + " <" + req.get("email") + "> — " + req.get("subject"));
        return ResponseEntity.ok(Map.of("message", "Message received. We will get back to you within 24 hours."));
    }
}
