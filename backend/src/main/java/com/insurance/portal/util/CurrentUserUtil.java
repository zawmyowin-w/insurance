package com.insurance.portal.util;

import com.insurance.portal.model.User;
import com.insurance.portal.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Resolves the authenticated {@link User} row from the JWT principal.
 *
 * The security filter puts the account email in {@code UserDetails#getUsername()},
 * so every controller has to look the entity up by email.
 */
public final class CurrentUserUtil {

    private CurrentUserUtil() {}

    /** The signed-in user, or throws if the row is gone (deleted account with a live token). */
    public static User require(UserRepository userRepo, UserDetails principal) {
        return userRepo.findByEmail(principal.getUsername()).orElseThrow();
    }

    /** The signed-in user, or {@code null} — for optional attribution (e.g. "verified by"). */
    public static User orNull(UserRepository userRepo, UserDetails principal) {
        return principal == null ? null : userRepo.findByEmail(principal.getUsername()).orElse(null);
    }
}
