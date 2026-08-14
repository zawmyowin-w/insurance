package com.insurance.portal.util;

import org.junit.jupiter.api.Test;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class DigitalSignatureUtilTest {

    private static final String PNG_PREFIX = "data:image/png;base64,";

    @Test
    void acceptsPngJpegAndJpgDataUrls() {
        String payload = Base64.getEncoder().encodeToString(new byte[]{1, 2, 3});
        assertNull(DigitalSignatureUtil.validationError(PNG_PREFIX + payload));
        assertNull(DigitalSignatureUtil.validationError("data:image/jpeg;base64," + payload));
        assertNull(DigitalSignatureUtil.validationError("data:image/jpg;base64," + payload));
    }

    @Test
    void requiresASignature() {
        assertEquals("Digital signature is required", DigitalSignatureUtil.validationError(null));
        assertEquals("Digital signature is required", DigitalSignatureUtil.validationError("   "));
    }

    @Test
    void rejectsOversizedSignatures() {
        String oversized = PNG_PREFIX + "A".repeat(2_000_001);
        assertEquals("Digital signature is too large", DigitalSignatureUtil.validationError(oversized));
    }

    @Test
    void rejectsNonImageDataUrls() {
        String payload = Base64.getEncoder().encodeToString(new byte[]{9});
        assertEquals("Invalid digital signature format",
                DigitalSignatureUtil.validationError("data:application/pdf;base64," + payload));
        assertEquals("Invalid digital signature format",
                DigitalSignatureUtil.validationError("data:image/gif;base64," + payload));
        assertEquals("Invalid digital signature format",
                DigitalSignatureUtil.validationError(payload));
        assertEquals("Invalid digital signature format",
                DigitalSignatureUtil.validationError(",abcd"));
    }

    @Test
    void rejectsEmptyPayload() {
        assertEquals("Digital signature is empty", DigitalSignatureUtil.validationError(PNG_PREFIX));
    }

    @Test
    void rejectsUndecodablePayload() {
        assertEquals("Invalid digital signature data", DigitalSignatureUtil.validationError(PNG_PREFIX + "!!!!"));
    }
}
