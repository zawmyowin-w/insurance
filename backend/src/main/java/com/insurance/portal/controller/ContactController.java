package com.insurance.portal.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import com.insurance.portal.util.ApiResponseUtil;

@RestController
public class ContactController {

    @PostMapping("/contact")
    public ResponseEntity<?> contact(@RequestBody Map<String, String> req) {
        return ApiResponseUtil.ok("Message received. We will get back to you within 24 hours.");
    }
}
