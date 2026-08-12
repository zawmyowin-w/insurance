package com.insurance.portal.util;

/**
 * Myanmar mobile phone number validation utility.
 *
 * Enforced rules (mirrors the frontend getPhoneValidationError function):
 *  1.  Required — must not be null or blank
 *  2.  Trim leading/trailing whitespace before validation
 *  3.  Must start with exactly "+959"
 *  4.  No spaces anywhere
 *  5.  No special characters (-, _, ., /, \, (, ), ,, #, *, @, !, $, etc.)
 *  6.  Only digits and a single leading '+' are allowed — no letters,
 *      Myanmar script, emoji, or other Unicode symbols
 *  7.  Digits after +959: exactly 7 or 9 digits (8 digits are rejected)
 *  8.  No duplicated country code (+95959…, +959095…)
 *  9.  Fake numbers blocked: all-same digit (000000000, 111111111…)
 * 10.  Sequential digits blocked: 123456789, 987654321…
 *
 * DB uniqueness is checked separately by the caller (UserRepository#existsByPhone).
 */
public final class PhoneValidationUtil {

    private PhoneValidationUtil() {}

    public static final String REQUIRED_ERROR =
        "Phone number is required.";
    public static final String SPACE_ERROR =
        "Phone number must not contain any spaces.";
    public static final String SPECIAL_CHAR_ERROR =
        "Phone number must not contain special characters (-, _, ., /, \\, (, ), ,, #, * etc.).";
    public static final String INVALID_CHARS_ERROR =
        "Phone number must contain only digits (0-9) after +959. " +
        "Letters, Myanmar characters, emoji and symbols are not allowed.";
    public static final String PLUS_PLACEMENT_ERROR =
        "The '+' symbol may only appear once, at the very beginning.";
    public static final String PREFIX_ERROR =
        "Phone number must start with +959 (Myanmar mobile prefix). " +
        "Formats like 09..., 959... or +95... are not accepted.";
    public static final String DOUBLE_CC_ERROR =
        "Phone number contains a duplicated country code (+95959...). " +
        "Enter only the subscriber digits after +959.";
    public static final String TOO_SHORT_ERROR =
        "Phone number is too short. +959 must be followed by exactly 7 or 9 digits.";
    public static final String INVALID_LENGTH_ERROR =
        "Phone number must contain exactly 7 or 9 digits after +959. 8 digits are not accepted.";
    public static final String TOO_LONG_ERROR =
        "Phone number is too long. +959 must be followed by exactly 7 or 9 digits.";
    public static final String FAKE_ERROR =
        "Phone number appears to be fake (all same digits). Please enter a real phone number.";
    public static final String SEQUENTIAL_ERROR =
        "Phone number appears to be sequential (e.g. 123456789). Please enter a real phone number.";
    public static final String DUPLICATE_ERROR =
        "This phone number is already registered. Please use a different number.";

    /**
     * Validates the raw phone string and returns an error message, or {@code null} if valid.
     * Does NOT check DB uniqueness — do that separately.
     */
    public static String validate(String rawPhone) {
        // ① Required
        if (rawPhone == null || rawPhone.isEmpty()) return REQUIRED_ERROR;

        // ② Trim leading/trailing spaces
        String phone = rawPhone.trim();
        if (phone.isEmpty()) return REQUIRED_ERROR;

        // ③ No internal spaces
        if (phone.chars().anyMatch(Character::isWhitespace)) return SPACE_ERROR;

        // ④ No disallowed special characters
        if (phone.matches(".*[-_./\\\\(),'\"#*@!$%^&=<>?|;:`~].*")) return SPECIAL_CHAR_ERROR;

        // ⑤ Only '+' and digits allowed (catches letters, Myanmar, emoji, surrogates)
        if (!phone.matches("[+0-9]+")) return INVALID_CHARS_ERROR;

        // ⑥ '+' only at start, only once
        long plusCount = phone.chars().filter(c -> c == '+').count();
        if (plusCount > 1) return PLUS_PLACEMENT_ERROR;
        if (plusCount == 1 && !phone.startsWith("+")) return PLUS_PLACEMENT_ERROR;

        // ⑦ Must start with +959
        if (!phone.startsWith("+959")) {
            return PREFIX_ERROR;
        }

        String digits = phone.substring(4); // everything after +959

        // ⑧ No duplicated country code
        if (digits.startsWith("95") || digits.startsWith("059") || digits.startsWith("09")) {
            return DOUBLE_CC_ERROR;
        }

        // Guard: digits must be all digits
        if (!digits.matches("\\d*")) return INVALID_CHARS_ERROR;

        // ⑨ Length: exactly 7 or 9 digits after +959 (8 is intentionally invalid)
        if (digits.length() < 7) return TOO_SHORT_ERROR;
        if (digits.length() == 8) return INVALID_LENGTH_ERROR;
        if (digits.length() > 9) return TOO_LONG_ERROR;

        // ⑩ Fake: all same digit
        if (digits.chars().distinct().count() == 1) return FAKE_ERROR;

        // ⑪ Sequential ascending or descending
        boolean asc = true, desc = true;
        for (int i = 1; i < digits.length(); i++) {
            int cur  = Character.getNumericValue(digits.charAt(i));
            int prev = Character.getNumericValue(digits.charAt(i - 1));
            if (cur != prev + 1) asc  = false;
            if (cur != prev - 1) desc = false;
            if (!asc && !desc) break;
        }
        if (asc || desc) return SEQUENTIAL_ERROR;

        return null; // ✓ Valid
    }

    /** Convenience boolean wrapper. */
    public static boolean isValid(String rawPhone) {
        return validate(rawPhone) == null;
    }

    /**
     * Normalizes a valid phone string to canonical storage format: +959XXXXXXX.
     * Assumes the input has already passed {@link #validate(String)}.
     */
    public static String normalize(String phone) {
        return phone == null ? null : phone.trim();
    }
}
