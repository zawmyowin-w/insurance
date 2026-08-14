package com.insurance.portal.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Public endpoint that returns the server's current epoch milliseconds.
 * Used by the frontend to compute a clock-drift offset and keep countdowns
 * exactly in sync with the server (no authentication required).
 */
@RestController
@RequestMapping("/public")
public class ServerTimeController {

    @GetMapping("/server-time")
    public Map<String, Long> serverTime() {
        return Map.of("epochMs", System.currentTimeMillis());
    }
}
