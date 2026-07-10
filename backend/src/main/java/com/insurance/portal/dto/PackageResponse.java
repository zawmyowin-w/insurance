package com.insurance.portal.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.insurance.portal.model.InsurancePackage;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

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
        // Parse durations
        try {
            if (pkg.getDurationsJson() != null) {
                dto.setDurations(Arrays.stream(pkg.getDurationsJson().split(","))
                        .map(String::trim).map(Integer::parseInt).toList());
            }
        } catch (Exception e) {
            dto.setDurations(List.of(1, 2, 3));
        }
        // Parse benefits
        try {
            if (pkg.getBenefitsJson() != null) {
                dto.setBenefits(Arrays.stream(pkg.getBenefitsJson().split("\n"))
                        .map(String::trim).filter(s -> !s.isEmpty()).toList());
            }
        } catch (Exception e) {
            dto.setBenefits(List.of());
        }
        return dto;
    }
}
