package com.insurance.portal.util;

import java.util.Set;
import java.util.regex.Pattern;

/**
 * Gmail-only email validation.
 *
 * Rules enforced:
 *   1.  Required — not null/blank.
 *   2.  No leading/trailing spaces.
 *   3.  Case-insensitive — normalize to lowercase before validating.
 *   4.  Exactly one '@' symbol.
 *   5.  Domain must be exactly 'gmail.com'.
 *   6.  Username: 6–30 characters.
 *   7.  Username: only lowercase letters, digits, dots.
 *   8.  Username must not start with a dot.
 *   9.  Username must not end with a dot.
 *  10.  No consecutive dots ('..').
 *  11.  No special characters (covered by rule 7).
 *  15-17. Common fake/test/temp usernames are blacklisted.
 *
 * Used wherever a user email is created or changed (registration, agent
 * creation, profile edits). Not applied on login so existing accounts are
 * never locked out.
 */
public final class EmailValidationUtil {

    /** Allowed chars in Gmail username */
    private static final Pattern USERNAME_CHARS = Pattern.compile("^[a-z0-9.]+$");

    private static final int USERNAME_MIN = 6;
    private static final int USERNAME_MAX = 30;

    /** Blacklisted Gmail usernames (fake, test, spam, temp) */
    private static final Set<String> BLACKLIST = Set.of(
        "test", "admin", "noreply", "no.reply", "donotreply", "do.not.reply",
        "fake", "spam", "trash", "disposable", "temp", "temporary",
        "test123", "test.user", "example", "sample", "demo", "guest",
        "anonymous", "abuse", "postmaster", "webmaster", "info", "support",
        "contact", "hello", "mail", "email", "user", "account"
    );

    /** Convenience constant for callers that only need one generic message */
    public static final String ERROR_MESSAGE =
        "Only valid Gmail addresses (@gmail.com) are accepted. " +
        "Username must be 6–30 characters using letters, numbers, and dots only " +
        "(no leading/trailing/consecutive dots).";

    private EmailValidationUtil() {}

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Normalise an email address: trim whitespace and convert to lowercase.
     * Always call this before persisting or comparing.
     */
    public static String normalize(String raw) {
        return (raw == null) ? null : raw.trim().toLowerCase();
    }

    /**
     * Full validation. Returns a specific English error message, or {@code null}
     * if the email is valid (after normalization).
     *
     * @param rawEmail  The raw input (may be un-normalized).
     */
    public static String validate(String rawEmail) {
        // Rule 1-2: required, not blank
        if (rawEmail == null || rawEmail.isEmpty()) {
            return "Email is required.";
        }
        if (!rawEmail.equals(rawEmail.trim())) {
            return "Email must not have leading or trailing spaces.";
        }

        final String email = rawEmail.toLowerCase(); // Rule 3: case-insensitive

        // Rule 4: exactly one @
        long atCount = email.chars().filter(c -> c == '@').count();
        if (atCount == 0) return "Email must contain the @ symbol.";
        if (atCount > 1)  return "Email must contain exactly one @ symbol.";

        int atIdx = email.indexOf('@');
        String username = email.substring(0, atIdx);
        String domain   = email.substring(atIdx + 1);

        // Rules 5, 13, 14: domain must be exactly gmail.com
        if (!"gmail.com".equals(domain)) {
            return "Only @gmail.com email addresses are accepted (got: @" + domain + ").";
        }

        // Rules 8, 9: leading/trailing dot (checked before length for precise error messages)
        if (username.startsWith(".")) {
            return "Gmail username must not start with a dot.";
        }
        if (username.endsWith(".")) {
            return "Gmail username must not end with a dot.";
        }

        // Rule 6: username length
        if (username.length() < USERNAME_MIN) {
            return "Gmail username must be at least " + USERNAME_MIN + " characters " +
                   "(yours has " + username.length() + ").";
        }
        if (username.length() > USERNAME_MAX) {
            return "Gmail username must not exceed " + USERNAME_MAX + " characters " +
                   "(yours has " + username.length() + ").";
        }

        // Rule 7, 11: only letters, digits, dots
        if (!USERNAME_CHARS.matcher(username).matches()) {
            return "Gmail username may only contain letters (a–z), numbers (0–9), and dots (.).";
        }

        // Rule 10: no consecutive dots
        if (username.contains("..")) {
            return "Gmail username must not contain consecutive dots (..).";
        }

        // Rules 15-17: blacklist
        if (BLACKLIST.contains(username)) {
            return "This email address is not allowed. Please use your real Gmail address.";
        }

        return null; // ✓ Valid
    }

    /**
     * Convenience wrapper — returns {@code true} if {@link #validate} returns null.
     * Accepts un-normalized input.
     */
    public static boolean isValid(String rawEmail) {
        return validate(rawEmail) == null;
    }
}
