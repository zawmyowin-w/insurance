package com.insurance.portal.security;

import com.insurance.portal.model.User;
import com.insurance.portal.model.enums.Role;
import com.insurance.portal.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService service;

    private static User user(Role role, boolean active) {
        return User.builder()
                .id(1L)
                .name("Zaw")
                .email("zaw@example.com")
                .password("hashed")
                .role(role)
                .active(active)
                .build();
    }

    @Test
    void mapsUserToUserDetailsWithRolePrefixedAuthority() {
        when(userRepository.findByEmail("zaw@example.com")).thenReturn(Optional.of(user(Role.CUSTOMER, true)));

        UserDetails details = service.loadUserByUsername("zaw@example.com");

        assertEquals("zaw@example.com", details.getUsername());
        assertEquals("hashed", details.getPassword());
        assertTrue(details.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CUSTOMER")));
    }

    @Test
    void throwsWhenUserIsMissing() {
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        UsernameNotFoundException ex = assertThrows(UsernameNotFoundException.class,
                () -> service.loadUserByUsername("missing@example.com"));
        assertTrue(ex.getMessage().contains("User not found"));
    }

    @Test
    void throwsWhenAccountIsDisabled() {
        when(userRepository.findByEmail("zaw@example.com")).thenReturn(Optional.of(user(Role.AGENT, false)));

        UsernameNotFoundException ex = assertThrows(UsernameNotFoundException.class,
                () -> service.loadUserByUsername("zaw@example.com"));
        assertTrue(ex.getMessage().contains("disabled"));
    }
}
