package com.insurance.portal.controller;

import com.insurance.portal.model.AutoCheckLog;
import com.insurance.portal.repository.AutoCheckLogRepository;
import com.insurance.portal.service.AutoCheckService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/autocheck")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminAutoCheckController {

    private final AutoCheckService      autoCheckService;
    private final AutoCheckLogRepository logRepo;

    @Value("${app.autocheck.enabled:true}")
    private boolean autoCheckEnabled;

    @Value("${app.autocheck.verify-cron:0 30 2 * * *}")
    private String verifyCron;

    @Value("${app.autocheck.reminder-cron:0 30 1 * * *}")
    private String reminderCron;

    @Value("${app.autocheck.min-pending-hours:1}")
    private int minPendingHours;

    @Value("${OPENAI_API_KEY:}")
    private String openAiKey;

    // ── Status / settings ────────────────────────────────────────────
    @GetMapping("/status")
    @Transactional(readOnly = true)
    public Map<String, Object> getStatus() {
        // Next run (approximate display — using Myanmar time UTC+6:30)
        ZoneId myanmarTz = ZoneId.of("Asia/Yangon");
        ZonedDateTime nowMM = ZonedDateTime.now(myanmarTz);
        String fmt = "yyyy-MM-dd HH:mm:ss";

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("enabled",          autoCheckEnabled);
        r.put("aiEnabled",        isAiEnabled());
        r.put("verifyCron",       verifyCron);
        r.put("reminderCron",     reminderCron);
        r.put("minPendingHours",  minPendingHours);
        r.put("currentTimeMM",    nowMM.format(DateTimeFormatter.ofPattern(fmt)));

        // Last run for each type
        Map<String, Object> lastRuns = new LinkedHashMap<>();
        for (String type : List.of("AUTO_VERIFY", "REMINDER")) {
            logRepo.findTop1ByCheckTypeOrderByCreatedAtDesc(type).stream().findFirst()
                    .ifPresentOrElse(l -> lastRuns.put(type, Map.of(
                            "status",        l.getStatus(),
                            "summary",       l.getSummary() != null ? l.getSummary() : "",
                            "totalChecked",  l.getTotalChecked(),
                            "affectedCount", l.getAffectedCount(),
                            "aiAssisted",    l.isAiAssisted(),
                            "createdAt",     l.getCreatedAt()
                    )), () -> lastRuns.put(type, null));
        }
        r.put("lastRuns", lastRuns);

        // Stats: today's counts
        LocalDateTime todayStart = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        r.put("todayVerified",  logRepo.countByCheckTypeAndCreatedAtAfter("AUTO_VERIFY", todayStart));
        r.put("todayReminders", logRepo.countByCheckTypeAndCreatedAtAfter("REMINDER",    todayStart));

        return r;
    }

    // ── Recent logs ───────────────────────────────────────────────────
    @GetMapping("/logs")
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getLogs(@RequestParam(defaultValue = "ALL") String type) {
        List<AutoCheckLog> logs = "ALL".equals(type)
                ? logRepo.findTop50ByOrderByCreatedAtDesc()
                : logRepo.findByCheckTypeOrderByCreatedAtDesc(type);
        return logs.stream().map(l -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",            l.getId());
            m.put("checkType",     l.getCheckType());
            m.put("status",        l.getStatus());
            m.put("summary",       l.getSummary());
            m.put("totalChecked",  l.getTotalChecked());
            m.put("affectedCount", l.getAffectedCount());
            m.put("aiAssisted",    l.isAiAssisted());
            m.put("createdAt",     l.getCreatedAt());
            // Parse details JSON for display
            try {
                if (l.getDetails() != null && !l.getDetails().isBlank()) {
                    m.put("details", new com.fasterxml.jackson.databind.ObjectMapper()
                            .readValue(l.getDetails(), List.class));
                }
            } catch (Exception ignored) {}
            return m;
        }).collect(Collectors.toList());
    }

    // ── Manual triggers ───────────────────────────────────────────────
    @PostMapping("/run/verify")
    @Transactional
    public ResponseEntity<?> triggerVerify() {
        try {
            Map<String, Object> result = autoCheckService.triggerVerification();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/run/reminders")
    @Transactional
    public ResponseEntity<?> triggerReminders() {
        try {
            Map<String, Object> result = autoCheckService.triggerReminders();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    private boolean isAiEnabled() {
        return openAiKey != null && !openAiKey.isBlank() && !openAiKey.startsWith("sk-placeholder");
    }
}
