package com.insurance.portal.dto;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.insurance.portal.model.InsurancePackage;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Data
public class PackageResponse {
    private Long id;
    private String name;
    private String type;
    private String description;
    private BigDecimal coverageMin;
    private BigDecimal coverageMax;
    private BigDecimal premiumRate;
    private List<Integer> durations;
    private List<String> benefits;
    private boolean active;
    private Integer minPolicyTerm;
    private Integer policyTerm;
    private String eligibility;
    private String exclusions;

    // New fields
    private List<Map<String, Object>> durationTiers;
    private List<Map<String, Object>> ageBands;
    private String paymentFrequency;
    private Integer paymentIntervalMonths;
    private BigDecimal maxClaimAmount;
    private String beneficiaryInfo;
    private List<String> requiredDocuments;
    private String termsAndConditions;
    private Integer claimWaitingPeriodMonths;

    // Transfer eligibility
    private boolean transferAllowed;
    private Integer transferEligibleAfterYears;
    private Integer transferEligibleAfterMonths;

    // Maturity / policy expiry payout
    private List<Map<String, Object>> maturityBonusTiers;
    private boolean maturityIncludesPremiums;

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static PackageResponse from(InsurancePackage pkg) {
        PackageResponse dto = new PackageResponse();
        dto.setId(pkg.getId());
        dto.setName(pkg.getName());
        dto.setType(pkg.getType());
        dto.setDescription(pkg.getDescription());
        dto.setCoverageMin(pkg.getCoverageMin());
        dto.setCoverageMax(pkg.getCoverageMax());
        dto.setPremiumRate(pkg.getPremiumRate());
        dto.setActive(pkg.isActive());
        dto.setMinPolicyTerm(pkg.getMinPolicyTerm());
        dto.setPolicyTerm(pkg.getPolicyTerm());
        dto.setEligibility(pkg.getEligibility());
        dto.setExclusions(pkg.getExclusions());
        dto.setPaymentFrequency(pkg.getPaymentFrequency());
        dto.setPaymentIntervalMonths(pkg.getPaymentIntervalMonths());
        dto.setMaxClaimAmount(pkg.getMaxClaimAmount());
        dto.setBeneficiaryInfo(pkg.getBeneficiaryInfo());
        dto.setTermsAndConditions(pkg.getTermsAndConditions());
        dto.setClaimWaitingPeriodMonths(pkg.getClaimWaitingPeriodMonths());
        dto.setTransferAllowed(pkg.isTransferAllowed());
        dto.setTransferEligibleAfterYears(pkg.getTransferEligibleAfterYears());
        dto.setTransferEligibleAfterMonths(pkg.getTransferEligibleAfterMonths());
        dto.setMaturityIncludesPremiums(pkg.isMaturityIncludesPremiums());

        // Parse benefits (newline-separated)
        try {
            if (pkg.getBenefitsJson() != null) {
                dto.setBenefits(Arrays.stream(pkg.getBenefitsJson().split("\n"))
                        .map(String::trim).filter(s -> !s.isEmpty()).toList());
            }
        } catch (Exception e) {
            dto.setBenefits(List.of());
        }

        // Parse duration tiers JSON and derive durations list from them
        try {
            if (pkg.getDurationTiersJson() != null && !pkg.getDurationTiersJson().isBlank()) {
                List<Map<String, Object>> tiers = MAPPER.readValue(pkg.getDurationTiersJson(),
                        new TypeReference<List<Map<String, Object>>>() {});
                dto.setDurationTiers(tiers);
                dto.setDurations(tiers.stream()
                        .map(t -> t.get("years") instanceof Number n ? n.intValue() : 0)
                        .filter(y -> y > 0)
                        .toList());
            } else {
                dto.setDurationTiers(List.of());
                dto.setDurations(List.of());
            }
        } catch (Exception e) {
            dto.setDurationTiers(List.of());
            dto.setDurations(List.of());
        }

        // Parse required documents JSON
        try {
            if (pkg.getRequiredDocumentsJson() != null && !pkg.getRequiredDocumentsJson().isBlank()) {
                dto.setRequiredDocuments(MAPPER.readValue(pkg.getRequiredDocumentsJson(),
                        new TypeReference<List<String>>() {}));
            }
        } catch (Exception e) {
            dto.setRequiredDocuments(List.of());
        }

        // Parse age bands JSON
        try {
            if (pkg.getAgeBandsJson() != null && !pkg.getAgeBandsJson().isBlank()) {
                dto.setAgeBands(MAPPER.readValue(pkg.getAgeBandsJson(),
                        new TypeReference<List<Map<String, Object>>>() {}));
            } else {
                dto.setAgeBands(List.of());
            }
        } catch (Exception e) {
            dto.setAgeBands(List.of());
        }

        // Parse maturity bonus tiers JSON
        try {
            if (pkg.getMaturityBonusTiersJson() != null && !pkg.getMaturityBonusTiersJson().isBlank()) {
                dto.setMaturityBonusTiers(MAPPER.readValue(pkg.getMaturityBonusTiersJson(),
                        new TypeReference<List<Map<String, Object>>>() {}));
            } else {
                dto.setMaturityBonusTiers(List.of());
            }
        } catch (Exception e) {
            dto.setMaturityBonusTiers(List.of());
        }

        return dto;
    }
}
