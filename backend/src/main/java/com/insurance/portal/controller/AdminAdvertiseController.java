package com.insurance.portal.controller;

import com.insurance.portal.model.Notification;
import com.insurance.portal.model.User;
import com.insurance.portal.model.enums.NotificationType;
import com.insurance.portal.model.enums.Role;
import com.insurance.portal.repository.NotificationRepository;
import com.insurance.portal.repository.UserRepository;
import com.insurance.portal.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Handles advertisement broadcasts — admin sends announcements about
 * new insurance types, packages, or agents to all customers.
 */
@RestController
@RequestMapping("/admin/advertise")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminAdvertiseController {

    private final UserRepository         userRepo;
    private final NotificationRepository notifRepo;
    private final NotificationService    notifService;

    // ── GET /admin/advertise/history ──────────────────────────────────
    // Returns recent advertisement notifications (last 30)
    @GetMapping("/history")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getHistory() {
        return notifRepo.findAll().stream()
                .filter(n -> n.getType() == NotificationType.ADVERTISE)
                .sorted(Comparator.comparing(Notification::getCreatedAt).reversed())
                .limit(30)
                .collect(Collectors.collectingAndThen(
                        Collectors.toList(),
                        list -> {
                            // De-duplicate by title+message (same broadcast goes to many users)
                            Map<String, Map<String, Object>> seen = new LinkedHashMap<>();
                            for (Notification n : list) {
                                String key = n.getTitle() + "||" + n.getMessage();
                                if (!seen.containsKey(key)) {
                                    Map<String, Object> m = new LinkedHashMap<>();
                                    m.put("title",   n.getTitle());
                                    m.put("message", n.getMessage());
                                    m.put("sentAt",  n.getCreatedAt());
                                    seen.put(key, m);
                                }
                            }
                            return new ArrayList<>(seen.values());
                        }
                ));
    }

    // ── POST /admin/advertise/broadcast ───────────────────────────────
    // Sends an advertisement notification to all active customers
    @PostMapping("/broadcast")
    @Transactional
    public ResponseEntity<?> broadcast(@RequestBody Map<String, Object> req) {
        String title   = req.getOrDefault("title",   "").toString().trim();
        String message = req.getOrDefault("message", "").toString().trim();

        if (title.isBlank() || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Title and message are required"));
        }

        List<User> customers = userRepo.findAllByRole(Role.CUSTOMER).stream()
                .filter(User::isActive)
                .toList();

        if (customers.isEmpty()) {
            return ResponseEntity.ok(Map.of("sent", 0, "message", "No active customers found"));
        }

        notifService.sendToAll(customers, title, message, NotificationType.ADVERTISE, "CUSTOMER");

        return ResponseEntity.ok(Map.of(
                "sent",    customers.size(),
                "title",   title,
                "message", message
        ));
    }
}
