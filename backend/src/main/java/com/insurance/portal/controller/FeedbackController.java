package com.insurance.portal.controller;

import com.insurance.portal.model.Feedback;
import com.insurance.portal.model.User;
import com.insurance.portal.repository.FeedbackRepository;
import com.insurance.portal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class FeedbackController {

    private static final int MESSAGE_MAX = 2000;
    private static final int CATEGORY_MAX = 50;

    private final FeedbackRepository feedbackRepo;
    private final UserRepository userRepo;

    // ── Customer: submit feedback ─────────────────────────────────────
    @PostMapping("/customer/feedback")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Transactional
    public ResponseEntity<?> submitFeedback(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, Object> body) {

        User customer = userRepo.findByEmail(principal.getUsername()).orElseThrow();

        int rating;
        try {
            rating = Integer.parseInt(body.getOrDefault("rating", "5").toString().trim());
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Rating must be a number between 1 and 5"));
        }
        if (rating < 1 || rating > 5)
            return ResponseEntity.badRequest().body(Map.of("message", "Rating must be between 1 and 5"));

        String message = body.getOrDefault("message", "").toString().trim();
        if (message.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("message", "Message is required"));
        if (message.length() > MESSAGE_MAX)
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Message must be at most " + MESSAGE_MAX + " characters"));

        String category = body.getOrDefault("category", "General").toString().trim();
        if (category.isEmpty()) category = "General";
        if (category.length() > CATEGORY_MAX)
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Category must be at most " + CATEGORY_MAX + " characters"));

        Feedback feedback = Feedback.builder()
                .customer(customer)
                .rating(rating)
                .category(category)
                .message(message)
                .read(false)
                .build();

        feedbackRepo.save(feedback);
        return ResponseEntity.ok(Map.of("message", "Feedback submitted successfully"));
    }

    // ── Admin: list all feedbacks ─────────────────────────────────────
    @GetMapping("/admin/feedback")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllFeedback() {
        return feedbackRepo.findAllByOrderByCreatedAtDesc().stream()
                .map(f -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", f.getId());
                    m.put("customerName", f.getCustomer().getName());
                    m.put("customerEmail", f.getCustomer().getEmail());
                    m.put("rating", f.getRating());
                    m.put("category", f.getCategory());
                    m.put("message", f.getMessage());
                    m.put("read", f.isRead());
                    m.put("createdAt", f.getCreatedAt());
                    return m;
                }).toList();
    }

    // ── Admin: unread count (for sidebar badge) ───────────────────────
    @GetMapping("/admin/feedback/unread-count")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public Map<String, Object> getUnreadCount() {
        return Map.of("count", feedbackRepo.countByReadFalse());
    }

    // ── Admin: mark one as read ───────────────────────────────────────
    @PutMapping("/admin/feedback/{id}/read")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> markRead(@PathVariable Long id) {
        Feedback f = feedbackRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Feedback not found"));
        f.setRead(true);
        feedbackRepo.save(f);
        return ResponseEntity.ok(Map.of("message", "Marked as read"));
    }

    // ── Admin: mark all as read ───────────────────────────────────────
    @PutMapping("/admin/feedback/read-all")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> markAllRead() {
        List<Feedback> unread = feedbackRepo.findAllByOrderByCreatedAtDesc()
                .stream().filter(f -> !f.isRead()).toList();
        unread.forEach(f -> f.setRead(true));
        feedbackRepo.saveAll(unread);
        return ResponseEntity.ok(Map.of("message", "All feedback marked as read"));
    }
}
