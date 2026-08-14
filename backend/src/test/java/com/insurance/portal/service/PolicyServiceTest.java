package com.insurance.portal.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Year;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PolicyServiceTest {

    private final PolicyService service = new PolicyService();

    private static String dobJson(int age) {
        return "{\"dob\":\"" + (Year.now().getValue() - age) + "-01-15\"}";
    }

    @Test
    void scoresLowRiskForYoungApplicantWithoutRiskFactors() {
        assertEquals("LOW", service.calculateRisk("LIFE", dobJson(30), "{\"smoking\":false}"));
        assertEquals("LOW", service.calculateRisk("LIFE", null, null));
    }

    @Test
    void scoresAgeBands() {
        assertEquals("LOW", service.calculateRisk("LIFE", dobJson(45), null));      // +1
        assertEquals("MEDIUM", service.calculateRisk("LIFE", dobJson(60), null));   // +3
    }

    @Test
    void addsLifeSpecificRiskFactors() {
        assertEquals("MEDIUM", service.calculateRisk("LIFE", dobJson(30),
                "{\"smoking\":true,\"hasDisease\":false}"));                        // +2
        assertEquals("HIGH", service.calculateRisk("LIFE", dobJson(60),
                "{\"smoking\":true,\"hasDisease\":true}"));                         // +3+2+2
    }

    @Test
    void addsHealthRiskOnlyWhenExistingDiseasesPresent() {
        assertEquals("MEDIUM", service.calculateRisk("HEALTH", dobJson(30),
                "{\"existingDiseases\":\"asthma\"}"));
        assertEquals("LOW", service.calculateRisk("HEALTH", dobJson(30),
                "{\"existingDiseases\":\"\"}"));
        assertEquals("LOW", service.calculateRisk("HEALTH", dobJson(30),
                "{\"existingDiseases\":null}"));
    }

    @Test
    void addsVehicleAgeRisk() {
        int year = Year.now().getValue();
        assertEquals("MEDIUM", service.calculateRisk("MOTOR", dobJson(30),
                "{\"vehicleYear\":\"" + (year - 12) + "\"}"));                      // +3
        assertEquals("LOW", service.calculateRisk("VEHICLE", dobJson(30),
                "{\"vehicleYear\":" + (year - 7) + "}"));                           // +1
        assertEquals("LOW", service.calculateRisk("VEHICLE", dobJson(30),
                "{\"vehicleYear\":\"" + year + "\"}"));
    }

    @Test
    void ignoresMalformedRiskInput() {
        assertEquals("LOW", service.calculateRisk("LIFE", "not json", "not json"));
    }

    @Test
    void appliesRiskMultiplierToPremium() {
        BigDecimal coverage = new BigDecimal("1000000");
        BigDecimal rate = new BigDecimal("0.0200");

        assertEquals(new BigDecimal("40000.00"), service.calculatePremium(coverage, rate, 2, "LOW"));
        assertEquals(new BigDecimal("48000.00"), service.calculatePremium(coverage, rate, 2, "MEDIUM"));
        assertEquals(new BigDecimal("60000.00"), service.calculatePremium(coverage, rate, 2, "HIGH"));
        assertEquals(new BigDecimal("20000.00"), service.calculatePremium(coverage, rate, 1, null));
    }

    @Test
    void returnsZeroPremiumWithoutRate() {
        assertEquals(BigDecimal.ZERO, service.calculatePremium(new BigDecimal("1000"), null, 1, "LOW"));
    }

    @Test
    void resolvesAgeBandRate() {
        String bands = "[{\"minAge\":18,\"maxAge\":40,\"premiumRate\":0.02},"
                + "{\"minAge\":41,\"maxAge\":65,\"premiumRate\":0.05}]";

        assertEquals(new BigDecimal("0.02"), service.getAgeBandRate(bands, dobJson(30)));
        assertEquals(new BigDecimal("0.05"), service.getAgeBandRate(bands, dobJson(50)));
        assertNull(service.getAgeBandRate(bands, dobJson(80)));     // no matching band
    }

    @Test
    void returnsNullAgeBandRateForMissingInput() {
        String bands = "[{\"minAge\":18,\"maxAge\":40,\"premiumRate\":0.02}]";

        assertNull(service.getAgeBandRate(null, dobJson(30)));
        assertNull(service.getAgeBandRate("  ", dobJson(30)));
        assertNull(service.getAgeBandRate(bands, null));            // no dob → unknown age
        assertNull(service.getAgeBandRate(bands, "{}"));
        assertNull(service.getAgeBandRate("not json", dobJson(30)));
    }

    @Test
    void generatesPolicyNumberFromType() {
        String number = service.generatePolicyNumber("LIFE");

        assertTrue(number.matches("POL-LIF-" + Year.now().getValue() + "-\\d{6}"),
                "unexpected policy number: " + number);
        assertTrue(service.generatePolicyNumber("hp").startsWith("POL-INS-"));
        assertTrue(service.generatePolicyNumber(null).startsWith("POL-INS-"));
    }
}
