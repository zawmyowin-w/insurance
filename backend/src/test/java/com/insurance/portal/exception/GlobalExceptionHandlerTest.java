package com.insurance.portal.exception;

import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.io.IOException;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @SuppressWarnings("unchecked")
    private static Map<String, String> body(ResponseEntity<?> response) {
        return (Map<String, String>) response.getBody();
    }

    /** Target for the synthetic {@link MethodParameter} used by the validation test. */
    @SuppressWarnings("unused")
    private void validatedEndpoint(Payload payload) {
    }

    static class Payload {
        private String email;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }

    @Test
    void mapsBadCredentialsToUnauthorized() {
        ResponseEntity<?> response = handler.handleBadCredentials(new BadCredentialsException("bad"));

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("Invalid email or password", body(response).get("message"));
    }

    @Test
    void mapsAccessDeniedToForbidden() {
        ResponseEntity<?> response = handler.handleAccessDenied(new AccessDeniedException("nope"));

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals("Access denied", body(response).get("message"));
    }

    @Test
    void joinsFieldErrorsForValidationFailures() throws NoSuchMethodException {
        BindingResult bindingResult = new BeanPropertyBindingResult(new Payload(), "payload");
        bindingResult.rejectValue("email", "NotBlank", "must not be blank");
        MethodParameter parameter = new MethodParameter(
                GlobalExceptionHandlerTest.class.getDeclaredMethod("validatedEndpoint", Payload.class), 0);

        ResponseEntity<?> response = handler.handleValidation(
                new MethodArgumentNotValidException(parameter, bindingResult));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("email: must not be blank", body(response).get("message"));
    }

    @Test
    void mapsRuntimeExceptionMessageToBadRequest() {
        ResponseEntity<?> response = handler.handleRuntime(new RuntimeException("Package not found"));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Package not found", body(response).get("message"));
    }

    @Test
    void describesRuntimeExceptionWithoutMessage() {
        ResponseEntity<?> response = handler.handleRuntime(new IllegalStateException());

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("An unexpected error occurred (IllegalStateException)", body(response).get("message"));
    }

    @Test
    void mapsCheckedExceptionToInternalServerError() {
        ResponseEntity<?> withMessage = handler.handleGeneral(new IOException("disk full"));
        ResponseEntity<?> withoutMessage = handler.handleGeneral(new IOException());

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, withMessage.getStatusCode());
        assertEquals("An internal error occurred: disk full", body(withMessage).get("message"));
        assertTrue(body(withoutMessage).get("message").endsWith("IOException"));
    }
}
