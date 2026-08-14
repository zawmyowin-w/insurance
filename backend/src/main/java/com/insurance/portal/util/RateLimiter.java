package com.insurance.portal.util;

import jakarta.servlet.http.HttpServletRequest;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Fixed-window, in-memory request counter keyed by an arbitrary string (usually the client IP).
 * Intended for abuse control on unauthenticated endpoints; state is per-instance and resets on restart.
 */
public final class RateLimiter {

    private final ConcurrentHashMap<String, List<Long>> attempts = new ConcurrentHashMap<>();
    private final int max;
    private final long windowMs;

    public RateLimiter(int max, long windowMs) {
        this.max = max;
        this.windowMs = windowMs;
    }

    /** Records an attempt and returns false when the caller is over the limit. */
    public boolean tryAcquire(String key) {
        long now = System.currentTimeMillis();
        List<Long> times = attempts.compute(key, (k, list) -> {
            if (list == null) list = new ArrayList<>();
            list.removeIf(t -> now - t > windowMs);
            return list;
        });
        synchronized (times) {
            if (times.size() >= max) return false;
            times.add(now);
            return true;
        }
    }

    /** Clears the counter for a key — call after a successful, legitimate action. */
    public void reset(String key) {
        attempts.remove(key);
    }

    /** Client IP, honouring the first X-Forwarded-For hop when behind a proxy. */
    public static String clientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        return (xff != null && !xff.isBlank()) ? xff.split(",")[0].trim() : req.getRemoteAddr();
    }
}
