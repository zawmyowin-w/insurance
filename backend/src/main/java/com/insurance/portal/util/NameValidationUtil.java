package com.insurance.portal.util;

/**
 * Validates customer names at the registration boundary.
 * A name must contain at least six Unicode letters and only single spaces
 * between name parts; numerals and punctuation are not permitted.
 */
public final class NameValidationUtil {

    private NameValidationUtil() {}

    public static final String REQUIRED_ERROR = "Full name is required.";
    public static final String SPACE_ERROR =
            "Full name must use single spaces only, with no space at the beginning or end.";
    public static final String LENGTH_ERROR = "Full name must contain at least 6 letters.";
    public static final String CHARACTERS_ERROR =
            "Full name may contain letters and spaces only. Numbers and special characters are not allowed.";

    public static String validate(String rawName) {
        if (rawName == null || rawName.trim().isEmpty()) return REQUIRED_ERROR;
        if (!rawName.equals(rawName.trim()) || rawName.matches(".*\\s{2,}.*")) return SPACE_ERROR;

        boolean hasInvalidCharacter = rawName.codePoints().anyMatch(cp ->
                !(Character.isLetter(cp)
                        || Character.getType(cp) == Character.NON_SPACING_MARK
                        || Character.getType(cp) == Character.COMBINING_SPACING_MARK
                        || cp == ' '));
        if (hasInvalidCharacter) return CHARACTERS_ERROR;

        long letterCount = rawName.codePoints()
                .filter(cp -> Character.isLetter(cp) || Character.getType(cp) == Character.NON_SPACING_MARK
                        || Character.getType(cp) == Character.COMBINING_SPACING_MARK)
                .count();
        return letterCount < 6 ? LENGTH_ERROR : null;
    }

    public static String normalize(String name) {
        return name == null ? null : name.trim();
    }
}