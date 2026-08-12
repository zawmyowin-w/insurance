package com.insurance.portal.util;

import java.util.Set;
import java.util.regex.Pattern;

/**
 * Email validation — accepts any real domain (not Gmail-only).
 *
 * Rules enforced:
 *   1.  Required — not null/blank.
 *   2.  No spaces anywhere (leading, trailing, internal).
 *   3.  Lowercase only — uppercase letters (A-Z) not accepted.
 *   4.  Must not start or end with '@'.
 *   5.  Exactly one '@' symbol.
 *   6.  Username (before @): valid email characters, with no arbitrary length limit.
 *   7.  Username must start with a letter (a-z) or number (0-9).
 *   8.  Username must not end with . _ -
 *   9.  Username: only a-z, 0-9, ., _, - allowed; blocks +#$%&!?*() etc.
 *  10.  No consecutive dots (..) in username.
 *  11.  No consecutive underscores (__) in username.
 *  12.  No consecutive hyphens (--) in username.
 *  13.  No mixed consecutive special characters: ._ _. .- -.
 *  14.  Numeric-only username blocked (e.g. 123456@...).
 *  15.  Reserved/blacklisted usernames blocked (admin, root, system, test …).
 *  16.  Domain must start with a letter or number.
 *  17.  Domain must not contain underscore (_).
 *  18.  Domain must contain at least one dot.
 *  19.  Each domain label must not start or end with hyphen (-).
 *  20.  TLD (last domain segment): at least 2 letters.
 *  21.  Disposable/temp-mail domains blocked.
 *
 * Applied on registration, agent/admin creation, and profile e-mail updates.
 * Not applied on login so existing accounts are never locked out.
 */
public final class EmailValidationUtil {

    /** Allowed characters in the username part */
    private static final Pattern USERNAME_CHARS = Pattern.compile("^[a-z0-9._-]+$");

    /** Reserved/blacklisted usernames */
    private static final Set<String> RESERVED_USERNAMES = Set.of(
        "admin", "root", "system", "test",
        "noreply", "no.reply", "donotreply", "do.not.reply",
        "fake", "spam", "trash", "disposable", "temp", "temporary",
        "test123", "test.user", "example", "sample", "demo", "guest",
        "anonymous", "abuse", "postmaster", "webmaster", "info", "support",
        "contact", "hello", "mail", "email", "user", "account"
    );

    /** Common disposable / temporary email domains */
    private static final Set<String> DISPOSABLE_DOMAINS = Set.of(
        "mailinator.com", "guerrillamail.com", "tempmail.com", "temp-mail.org",
        "yopmail.com", "10minutemail.com", "trashmail.com", "fakeinbox.com",
        "sharklasers.com", "spam4.me", "maildrop.cc", "getnada.com",
        "dispostable.com", "mailnull.com", "spamgourmet.com", "throwam.com",
        "discardmail.com", "discard.email", "spamex.com", "getairmail.com",
        "incognitomail.com", "jetable.com", "meltmail.com", "pookmail.com",
        "wegwerfmail.de", "wegwerfmail.net", "wegwerfmail.org",
        "trashmail.at", "trashmail.io", "trashmail.me", "trashmail.net",
        "guerrillamail.info", "guerrillamail.biz", "guerrillamail.de",
        "guerrillamail.net", "guerrillamail.org", "grr.la",
        "mohmal.com", "filzmail.com", "spamavert.com", "spaminator.de",
        "spammotel.com", "spamspot.com", "zetmail.com", "noclickemail.com",
        "spamfree24.org", "deadaddress.com", "spamgob.com", "mailnew.com",
        "sogetthis.com", "privymail.de", "wpdfs.com"
    );

    /** Generic error for callers that only need one message */
    public static final String ERROR_MESSAGE =
        "Please enter a valid email address. " +
        "Username (before @) must use valid email characters (a-z, 0-9, dots, underscores, or hyphens) " +
        "(must start and end with a letter or number; no consecutive or mixed special characters). " +
        "Domain must have a valid TLD (at least 2 letters). Disposable and reserved addresses are not accepted.";

    private EmailValidationUtil() {}

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Normalise an email address: trim whitespace and convert to lowercase.
     * Always call this before persisting or comparing email addresses.
     */
    public static String normalize(String raw) {
        return (raw == null) ? null : raw.trim().toLowerCase();
    }

    /**
     * Full validation. Returns a specific English error message, or {@code null}
     * if the email is valid.
     *
     * Validates the raw input — no silent normalization is applied.
     *
     * @param rawEmail  The raw input string (may be un-normalized).
     */
    public static String validate(String rawEmail) {

        // ① Required
        if (rawEmail == null || rawEmail.isEmpty()) {
            return "Email is required.";
        }

        // ② No spaces anywhere
        if (rawEmail.chars().anyMatch(Character::isWhitespace)) {
            return "Email must not contain any spaces (including at the start or end).";
        }

        // ③ Lowercase only
        if (!rawEmail.equals(rawEmail.toLowerCase())) {
            return "Email must be lowercase only. Uppercase letters (A–Z) are not accepted.";
        }

        final String email = rawEmail; // confirmed: lowercase, no spaces

        // ④ Must not start with @
        if (email.startsWith("@")) {
            return "Email must not start with @.";
        }

        // ⑤ Must not end with @
        if (email.endsWith("@")) {
            return "Email must not end with @.";
        }

        // ⑥ Exactly one @
        long atCount = email.chars().filter(c -> c == '@').count();
        if (atCount == 0) return "Email must contain the @ symbol.";
        if (atCount > 1)  return "Email must contain exactly one @ symbol.";

        int    atIdx    = email.indexOf('@');
        String username = email.substring(0, atIdx);
        String domain   = email.substring(atIdx + 1);

        // ══ Username rules ════════════════════════════════════════════════════

        // ⑥ Must start with letter or number
        char first = username.charAt(0);
        if (!Character.isLetterOrDigit(first)) {
            return "Username must start with a letter (a–z) or number (0–9).";
        }

        // ⑧ Must not end with . _ -
        char last = username.charAt(username.length() - 1);
        if (last == '.' || last == '_' || last == '-') {
            String charName = last == '.' ? "dot (.)" : last == '_' ? "underscore (_)" : "hyphen (-)";
            return "Username must not end with a " + charName + ".";
        }

        // ⑨ Allowed characters: a-z, 0-9, . _ -
        if (!USERNAME_CHARS.matcher(username).matches()) {
            return "Username may only contain letters (a–z), numbers (0–9), dots (.), " +
                   "underscores (_), or hyphens (-). " +
                   "Special characters like +, #, $, %, &, !, ?, *, (, ) are not allowed.";
        }

        // ⑩ No consecutive dots
        if (username.contains("..")) {
            return "Username must not contain consecutive dots (..).";
        }

        // ⑪ No consecutive underscores
        if (username.contains("__")) {
            return "Username must not contain consecutive underscores (__).";
        }

        // ⑫ No consecutive hyphens
        if (username.contains("--")) {
            return "Username must not contain consecutive hyphens (--).";
        }

        // ⑬ No mixed consecutive special characters: ._ _. .- -.
        if (username.contains("._") || username.contains("_.") ||
            username.contains(".-") || username.contains("-.")) {
            return "Username must not contain mixed consecutive special characters " +
                   "(e.g. ._, _., .-, -.).";
        }

        // ⑭ Numeric-only username blocked
        if (username.chars().allMatch(Character::isDigit)) {
            return "Username must not be numbers only. Include at least one letter (a–z).";
        }

        // ⑮ Reserved/blacklisted usernames
        if (RESERVED_USERNAMES.contains(username)) {
            return "This email address is not allowed. Please use a different email.";
        }

        // ══ Domain rules ══════════════════════════════════════════════════════

        // ⑯ Domain must start with letter or number
        if (domain.isEmpty() || !Character.isLetterOrDigit(domain.charAt(0))) {
            return "Email domain must start with a letter or number.";
        }

        // ⑰ Domain must not contain underscore
        if (domain.contains("_")) {
            return "Email domain must not contain underscores (_).";
        }

        // ⑱ Domain must have at least one dot
        if (!domain.contains(".")) {
            return "Email domain must contain at least one dot (e.g. example.com).";
        }

        String[] labels = domain.split("\\.", -1);

        // ⑲ Each label: non-empty, no leading/trailing hyphen
        for (String label : labels) {
            if (label.isEmpty()) {
                return "Email domain is not valid (contains consecutive dots or empty segments).";
            }
            if (label.startsWith("-") || label.endsWith("-")) {
                return "Email domain labels must not start or end with a hyphen (-).";
            }
        }

        // ⑳ TLD: at least 2 letters; no arbitrary maximum
        String tld = labels[labels.length - 1];
        if (!tld.matches("[a-z]+") || tld.length() < 2) {
            return "Email domain ending (TLD) must contain at least 2 letters " +
                   "(e.g. com, net, org, mm, edu).";
        }

        // ㉑ Disposable/temp-mail domains
        if (DISPOSABLE_DOMAINS.contains(domain)) {
            return "Temporary or disposable email addresses are not allowed. " +
                   "Please use a real email address.";
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
