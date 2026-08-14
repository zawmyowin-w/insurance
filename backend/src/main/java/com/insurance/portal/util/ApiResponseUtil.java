package com.insurance.portal.util;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

/**
 * Builders for the {@code {"message": "..."}} JSON envelope every controller
 * returns for success confirmations and error details.
 *
 * The frontend reads errors from {@code err.response.data.message}
 * (see frontend/src/utils/apiError.js), so the key must stay "message".
 */
public final class ApiResponseUtil {

    private ApiResponseUtil() {}

    /** Raw {@code {"message": ...}} body, for callers that build their own ResponseEntity. */
    public static Map<String, String> message(String message) {
        return Map.of("message", message);
    }

    /** 200 with a message body. */
    public static ResponseEntity<Map<String, String>> ok(String message) {
        return ResponseEntity.ok(message(message));
    }

    /** 400 with a message body. */
    public static ResponseEntity<Map<String, String>> badRequest(String message) {
        return ResponseEntity.badRequest().body(message(message));
    }

    /** 404 with a message body. */
    public static ResponseEntity<Map<String, String>> notFound(String message) {
        return status(HttpStatus.NOT_FOUND, message);
    }

    /** Any status with a message body. */
    public static ResponseEntity<Map<String, String>> status(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(message(message));
    }
}
