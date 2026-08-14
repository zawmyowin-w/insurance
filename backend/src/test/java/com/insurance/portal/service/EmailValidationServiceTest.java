package com.insurance.portal.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;

class EmailValidationServiceTest {

    private final EmailValidationService service = spy(new EmailValidationService());

    @Test
    void acceptsEmailWithMxRecord() {
        doReturn(true).when(service).hasMxRecord("example.com");

        EmailValidationService.Result result = service.validate("  Zaw@Example.com ");

        assertTrue(result.valid());
        assertNull(result.errorMessage());
        verify(service).hasMxRecord("example.com");
    }

    @Test
    void rejectsEmailWithoutMxRecord() {
        doReturn(false).when(service).hasMxRecord("example.com");

        EmailValidationService.Result result = service.validate("zaw@example.com");

        assertFalse(result.valid());
        assertTrue(result.errorMessage().contains("does not appear to have a valid mail server"));
    }

    @Test
    void reportsFormatErrorsBeforeCheckingDns() {
        EmailValidationService.Result result = service.validate("zaw@@example.com");

        assertFalse(result.valid());
        assertEquals("Email must contain exactly one @ symbol.", result.errorMessage());
        verify(service, org.mockito.Mockito.never()).hasMxRecord(org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void reportsDisposableDomainAsInvalid() {
        EmailValidationService.Result result = service.validate("zawmyo@mailinator.com");

        assertFalse(result.valid());
        assertTrue(result.errorMessage().contains("disposable"));
    }

    @Test
    void failsOpenWhenDnsLookupCannotResolveDomain() {
        // Unresolvable domains must not block registration — hasMxRecord fails open on DNS errors.
        assertTrue(service.hasMxRecord("nonexistent-domain-for-tests.invalid"));
    }
}
