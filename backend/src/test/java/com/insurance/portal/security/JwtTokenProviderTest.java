package com.insurance.portal.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtTokenProviderTest {

    private static final String SECRET = "test-jwt-secret-key-that-is-long-enough-for-hs256";

    private JwtTokenProvider provider;

    @BeforeEach
    void setUp() {
        provider = new JwtTokenProvider();
        ReflectionTestUtils.setField(provider, "jwtSecret", SECRET);
        ReflectionTestUtils.setField(provider, "jwtExpirationMs", 60_000L);
    }

    @Test
    void generatesTokenCarryingTheEmailAsSubject() {
        String token = provider.generateToken("customer@example.com");

        assertTrue(provider.validateToken(token));
        assertEquals("customer@example.com", provider.getEmailFromToken(token));
    }

    @Test
    void generatesTokenFromAuthenticationPrincipal() {
        UserDetails principal = new User("agent@example.com", "pw", Collections.emptyList());
        Authentication authentication = new UsernamePasswordAuthenticationToken(principal, "pw");

        String token = provider.generateToken(authentication);

        assertEquals("agent@example.com", provider.getEmailFromToken(token));
    }

    @Test
    void rejectsTokenSignedWithAnotherSecret() {
        JwtTokenProvider other = new JwtTokenProvider();
        ReflectionTestUtils.setField(other, "jwtSecret", "another-secret-key-that-is-also-long-enough-x");
        ReflectionTestUtils.setField(other, "jwtExpirationMs", 60_000L);

        assertFalse(provider.validateToken(other.generateToken("customer@example.com")));
    }

    @Test
    void rejectsExpiredToken() {
        String expired = Jwts.builder()
                .setSubject("customer@example.com")
                .setIssuedAt(new Date(System.currentTimeMillis() - 120_000))
                .setExpiration(new Date(System.currentTimeMillis() - 60_000))
                .signWith(Keys.hmacShaKeyFor(SECRET.getBytes()), SignatureAlgorithm.HS256)
                .compact();

        assertFalse(provider.validateToken(expired));
    }

    @Test
    void rejectsMalformedAndEmptyTokens() {
        assertFalse(provider.validateToken("not-a-jwt"));
        assertFalse(provider.validateToken(""));
        assertFalse(provider.validateToken(null));
    }
}
