package com.insurance.portal.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private CustomUserDetailsService userDetailsService;

    @Mock
    private FilterChain filterChain;

    private final MockHttpServletResponse response = new MockHttpServletResponse();

    private JwtAuthenticationFilter filter() {
        return new JwtAuthenticationFilter(tokenProvider, userDetailsService);
    }

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void authenticatesRequestWithValidBearerToken() throws Exception {
        UserDetails userDetails = new User("zaw@example.com", "hashed",
                List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")));
        when(tokenProvider.validateToken("good-token")).thenReturn(true);
        when(tokenProvider.getEmailFromToken("good-token")).thenReturn("zaw@example.com");
        when(userDetailsService.loadUserByUsername("zaw@example.com")).thenReturn(userDetails);

        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer good-token");

        filter().doFilter(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertEquals(userDetails, auth.getPrincipal());
        assertEquals("ROLE_CUSTOMER", auth.getAuthorities().iterator().next().getAuthority());
        assertNotNull(auth.getDetails());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void leavesContextUnauthenticatedForInvalidToken() throws Exception {
        when(tokenProvider.validateToken("bad-token")).thenReturn(false);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer bad-token");

        filter().doFilter(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void ignoresMissingOrNonBearerAuthorizationHeaders() throws Exception {
        MockHttpServletRequest noHeader = new MockHttpServletRequest();
        MockHttpServletRequest basicAuth = new MockHttpServletRequest();
        basicAuth.addHeader("Authorization", "Basic dXNlcjpwdw==");
        MockHttpServletRequest emptyBearer = new MockHttpServletRequest();
        emptyBearer.addHeader("Authorization", "Bearer ");

        filter().doFilter(noHeader, response, filterChain);
        filter().doFilter(basicAuth, response, filterChain);
        filter().doFilter(emptyBearer, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(noHeader, response);
        verify(filterChain).doFilter(basicAuth, response);
        verify(filterChain).doFilter(emptyBearer, response);
    }
}
