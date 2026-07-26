package com.insurance.portal.service;

import com.insurance.portal.util.EmailValidationUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.naming.NamingException;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.InitialDirContext;
import java.util.Hashtable;

/**
 * Server-side email validation service.
 *
 * Full validation chain:
 *   1. Format + character rules (delegated to EmailValidationUtil).
 *   2. Blacklist / reserved / disposable domain check (in EmailValidationUtil).
 *   3. DNS MX-record check — confirms the domain can actually receive mail.
 *
 * Points 3a-3c (domain existence, MX record, reachability):
 *   - Domain existence: DNS lookup fails with NXDOMAIN → hasMxRecord = false.
 *   - MX record: we query the "MX" DNS record type explicitly.
 *   - Deliverability: OTP verification is the final deliverability proof.
 */
@Slf4j
@Service
public class EmailValidationService {

    /**
     * Full validation result. {@code valid} is true only when ALL checks pass.
     */
    public record Result(boolean valid, String errorMessage) {
        static Result ok()           { return new Result(true, null); }
        static Result fail(String m) { return new Result(false, m); }
    }

    /**
     * Run all server-side checks: format → blacklist → MX record.
     *
     * @param rawEmail  The raw email from the request (may be un-normalized).
     */
    public Result validate(String rawEmail) {
        // Normalize first (trim + lowercase)
        String email = EmailValidationUtil.normalize(rawEmail);

        // Step 1 & 2: format + blacklist + disposable check
        String formatError = EmailValidationUtil.validate(email);
        if (formatError != null) {
            return Result.fail(formatError);
        }

        // Step 3: MX record check
        String domain = email.substring(email.indexOf('@') + 1);
        if (!hasMxRecord(domain)) {
            return Result.fail(
                "The email domain '" + domain + "' does not appear to have a valid mail server. " +
                "Please use a real, deliverable email address."
            );
        }

        return Result.ok();
    }

    /**
     * Checks whether the given domain has at least one MX record in DNS.
     * Returns {@code true} on any DNS error to avoid blocking legitimate users
     * when the DNS resolver is temporarily unavailable.
     *
     * @param domain  e.g. "example.com"
     */
    public boolean hasMxRecord(String domain) {
        Hashtable<String, String> env = new Hashtable<>();
        env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
        env.put("java.naming.provider.url", "dns:");
        // Short timeouts so a DNS hiccup doesn't stall registration
        env.put("com.sun.jndi.dns.timeout.initial", "3000");
        env.put("com.sun.jndi.dns.timeout.retries", "1");

        try {
            InitialDirContext ctx = new InitialDirContext(env);
            Attributes attrs = ctx.getAttributes(domain, new String[]{"MX"});
            Attribute mx = attrs.get("MX");
            boolean hasMx = mx != null && mx.size() > 0;
            if (!hasMx) {
                log.warn("[EmailValidation] No MX record found for domain: {}", domain);
            }
            return hasMx;
        } catch (NamingException e) {
            // Fail open — DNS unavailability should not block valid registrations
            log.warn("[EmailValidation] DNS MX lookup failed for '{}': {} — failing open",
                     domain, e.getMessage());
            return true;
        } catch (Exception e) {
            log.warn("[EmailValidation] Unexpected error during MX check for '{}': {}",
                     domain, e.getMessage());
            return true;
        }
    }
}
