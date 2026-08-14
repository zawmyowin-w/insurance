package com.insurance.portal.util;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PhoneValidationUtilTest {

    @ParameterizedTest
    @ValueSource(strings = {
            "+959771234568",   // 9 digits after +959
            "+9597712345",     // 7 digits after +959
            "  +959771234568 " // surrounding whitespace is trimmed
    })
    void acceptsValidMyanmarNumbers(String phone) {
        assertNull(PhoneValidationUtil.validate(phone));
        assertTrue(PhoneValidationUtil.isValid(phone));
    }

    @Test
    void requiresAValue() {
        assertEquals(PhoneValidationUtil.REQUIRED_ERROR, PhoneValidationUtil.validate(null));
        assertEquals(PhoneValidationUtil.REQUIRED_ERROR, PhoneValidationUtil.validate(""));
        assertEquals(PhoneValidationUtil.REQUIRED_ERROR, PhoneValidationUtil.validate("   "));
    }

    @Test
    void rejectsInternalSpaces() {
        assertEquals(PhoneValidationUtil.SPACE_ERROR, PhoneValidationUtil.validate("+959 771234568"));
    }

    @Test
    void rejectsSpecialCharacters() {
        assertEquals(PhoneValidationUtil.SPECIAL_CHAR_ERROR, PhoneValidationUtil.validate("+959-771234568"));
        assertEquals(PhoneValidationUtil.SPECIAL_CHAR_ERROR, PhoneValidationUtil.validate("+959(77)1234568"));
    }

    @Test
    void rejectsLettersAndNonDigitSymbols() {
        assertEquals(PhoneValidationUtil.INVALID_CHARS_ERROR, PhoneValidationUtil.validate("+959abcdefghi"));
        assertEquals(PhoneValidationUtil.INVALID_CHARS_ERROR, PhoneValidationUtil.validate("+959၇၇၁၂၃၄၅၆၈"));
    }

    @Test
    void rejectsMisplacedOrRepeatedPlus() {
        assertEquals(PhoneValidationUtil.PLUS_PLACEMENT_ERROR, PhoneValidationUtil.validate("+959+771234568"));
        assertEquals(PhoneValidationUtil.PLUS_PLACEMENT_ERROR, PhoneValidationUtil.validate("959771234568+"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"09771234568", "959771234568", "+95771234568", "95771234568"})
    void rejectsWrongPrefixes(String phone) {
        assertEquals(PhoneValidationUtil.PREFIX_ERROR, PhoneValidationUtil.validate(phone));
    }

    @ParameterizedTest
    @ValueSource(strings = {"+95995771234", "+959059771234", "+95909771234"})
    void rejectsDuplicatedCountryCode(String phone) {
        assertEquals(PhoneValidationUtil.DOUBLE_CC_ERROR, PhoneValidationUtil.validate(phone));
    }

    @Test
    void enforcesSevenOrNineSubscriberDigits() {
        assertEquals(PhoneValidationUtil.TOO_SHORT_ERROR, PhoneValidationUtil.validate("+959771234"));
        assertEquals(PhoneValidationUtil.INVALID_LENGTH_ERROR, PhoneValidationUtil.validate("+95977123456"));
        assertEquals(PhoneValidationUtil.TOO_LONG_ERROR, PhoneValidationUtil.validate("+9597712345678"));
    }

    @Test
    void rejectsAllSameDigits() {
        assertEquals(PhoneValidationUtil.FAKE_ERROR, PhoneValidationUtil.validate("+959777777777"));
        assertEquals(PhoneValidationUtil.FAKE_ERROR, PhoneValidationUtil.validate("+9591111111"));
    }

    @Test
    void rejectsSequentialDigits() {
        assertEquals(PhoneValidationUtil.SEQUENTIAL_ERROR, PhoneValidationUtil.validate("+959123456789"));
        assertEquals(PhoneValidationUtil.SEQUENTIAL_ERROR, PhoneValidationUtil.validate("+959987654321"));
        assertEquals(PhoneValidationUtil.SEQUENTIAL_ERROR, PhoneValidationUtil.validate("+9591234567"));
    }

    @Test
    void isValidMirrorsValidate() {
        assertFalse(PhoneValidationUtil.isValid("+959123456789"));
        assertTrue(PhoneValidationUtil.isValid("+959771234568"));
    }

    @Test
    void normalizeTrimsAndPreservesNull() {
        assertEquals("+959771234568", PhoneValidationUtil.normalize("  +959771234568  "));
        assertNull(PhoneValidationUtil.normalize(null));
    }
}
