package com.insurance.portal.util;

import java.util.regex.Pattern;

/**
 * Enforces the local part (before the "@") of a new/changed email address
 * to start with a lowercase letter — it must not start with a capital
 * letter or a digit. Applied wherever a user's email is created or changed
 * (registration, admin agent creation, profile edits) — not on login, so
 * existing accounts are never locked out.
 */
public final class EmailValidationUtil {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[a-z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");

    public static final String ERROR_MESSAGE =
            "Email must start with a lowercase letter — it cannot begin with a capital letter or a number";

    private EmailValidationUtil() {}

    public static boolean isValid(String email) {
        return email != null && EMAIL_PATTERN.matcher(email).matches();
    }
}
