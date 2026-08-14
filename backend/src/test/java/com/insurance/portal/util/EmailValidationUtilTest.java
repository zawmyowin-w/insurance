package com.insurance.portal.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EmailValidationUtilTest {

    @ParameterizedTest
    @ValueSource(strings = {
            "zaw.myo@gmail.com",
            "customer_01@dicp.com.mm",
            "a-b.c_d@sub.example.co.uk",
            "agent1@example.mm"
    })
    void acceptsValidAddresses(String email) {
        assertNull(EmailValidationUtil.validate(email));
        assertTrue(EmailValidationUtil.isValid(email));
    }

    @Test
    void requiresAValue() {
        assertEquals("Email is required.", EmailValidationUtil.validate(null));
        assertEquals("Email is required.", EmailValidationUtil.validate(""));
    }

    @Test
    void rejectsWhitespaceAndUppercase() {
        assertTrue(EmailValidationUtil.validate(" zaw@gmail.com").contains("spaces"));
        assertTrue(EmailValidationUtil.validate("zaw m@gmail.com").contains("spaces"));
        assertTrue(EmailValidationUtil.validate("Zaw@gmail.com").contains("lowercase"));
    }

    @Test
    void rejectsMalformedAtSymbol() {
        assertEquals("Email must not start with @.", EmailValidationUtil.validate("@gmail.com"));
        assertEquals("Email must not end with @.", EmailValidationUtil.validate("zaw@"));
        assertEquals("Email must contain the @ symbol.", EmailValidationUtil.validate("zaw.gmail.com"));
        assertEquals("Email must contain exactly one @ symbol.", EmailValidationUtil.validate("zaw@a@gmail.com"));
    }

    @Test
    void enforcesUsernameStartAndEnd() {
        assertTrue(EmailValidationUtil.validate("_zaw@gmail.com").contains("must start with"));
        assertTrue(EmailValidationUtil.validate("zaw.@gmail.com").contains("dot (.)"));
        assertTrue(EmailValidationUtil.validate("zaw_@gmail.com").contains("underscore (_)"));
        assertTrue(EmailValidationUtil.validate("zaw-@gmail.com").contains("hyphen (-)"));
    }

    @Test
    void rejectsDisallowedUsernameCharacters() {
        assertTrue(EmailValidationUtil.validate("zaw+tag@gmail.com").contains("may only contain"));
        assertTrue(EmailValidationUtil.validate("zaw!myo@gmail.com").contains("may only contain"));
    }

    @Test
    void rejectsConsecutiveAndMixedSpecialCharacters() {
        assertTrue(EmailValidationUtil.validate("zaw..myo@gmail.com").contains("consecutive dots"));
        assertTrue(EmailValidationUtil.validate("zaw__myo@gmail.com").contains("consecutive underscores"));
        assertTrue(EmailValidationUtil.validate("zaw--myo@gmail.com").contains("consecutive hyphens"));
        assertTrue(EmailValidationUtil.validate("zaw._myo@gmail.com").contains("mixed consecutive"));
        assertTrue(EmailValidationUtil.validate("zaw-.myo@gmail.com").contains("mixed consecutive"));
    }

    @Test
    void rejectsNumericOnlyAndReservedUsernames() {
        assertTrue(EmailValidationUtil.validate("123456@gmail.com").contains("numbers only"));
        assertTrue(EmailValidationUtil.validate("admin@gmail.com").contains("not allowed"));
        assertTrue(EmailValidationUtil.validate("support@gmail.com").contains("not allowed"));
    }

    @Test
    void enforcesDomainRules() {
        assertTrue(EmailValidationUtil.validate("zaw@-gmail.com").contains("start with a letter or number"));
        assertTrue(EmailValidationUtil.validate("zaw@my_mail.com").contains("underscores"));
        assertTrue(EmailValidationUtil.validate("zaw@localhost").contains("at least one dot"));
        assertTrue(EmailValidationUtil.validate("zaw@gmail..com").contains("empty segments"));
        assertTrue(EmailValidationUtil.validate("zaw@my-.com").contains("hyphen"));
        assertTrue(EmailValidationUtil.validate("zaw@gmail.c").contains("TLD"));
        assertTrue(EmailValidationUtil.validate("zaw@gmail.c0m").contains("TLD"));
    }

    @Test
    void rejectsDisposableDomains() {
        assertTrue(EmailValidationUtil.validate("zawmyo@mailinator.com").contains("disposable"));
        assertTrue(EmailValidationUtil.validate("zawmyo@yopmail.com").contains("disposable"));
    }

    @Test
    void normalizeTrimsAndLowercases() {
        assertEquals("zaw@gmail.com", EmailValidationUtil.normalize("  ZAW@Gmail.COM "));
        assertNull(EmailValidationUtil.normalize(null));
    }

    @Test
    void isValidMirrorsValidate() {
        assertFalse(EmailValidationUtil.isValid("Zaw@gmail.com"));
        assertNotNull(EmailValidationUtil.ERROR_MESSAGE);
    }
}
