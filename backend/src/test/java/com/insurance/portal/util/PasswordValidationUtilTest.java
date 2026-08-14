package com.insurance.portal.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PasswordValidationUtilTest {

    @ParameterizedTest
    @ValueSource(strings = {
            "Admin@123",
            "aB3$abcd",
            "Str0ng!Password",
            "Pa55word " // trailing space counts as the special character
    })
    void acceptsStrongPasswords(String password) {
        assertTrue(PasswordValidationUtil.isStrong(password));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "Ab3$def",        // 7 characters
            "abcdef1!",       // no uppercase
            "ABCDEF1!",       // no lowercase
            "Abcdefg!",       // no digit
            "Abcdefg1",       // no special character
            "        ",       // whitespace only
            "12345678"
    })
    void rejectsWeakPasswords(String password) {
        assertFalse(PasswordValidationUtil.isStrong(password));
    }

    @ParameterizedTest
    @NullAndEmptySource
    void rejectsNullAndEmpty(String password) {
        assertFalse(PasswordValidationUtil.isStrong(password));
    }

    @Test
    void exposesErrorMessageForCallers() {
        assertTrue(PasswordValidationUtil.ERROR_MESSAGE.contains("8 characters"));
    }
}
