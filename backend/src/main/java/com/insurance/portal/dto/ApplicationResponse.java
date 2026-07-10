package com.insurance.portal.dto;

import com.insurance.portal.model.PolicyApplication;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ApplicationResponse {
    private Long id;
    private String customerName;
    private String customerEmail;
    private Long customerId;
    private String packageName;
    private String packageType;
    private Long packageId;
    private String agentName;
    private Long agentId;
    private BigDecimal coverageAmount;
    private Integer duration;
    private String status;
    private String notes;
    private String agentNote;
    private String adminNote;
    private LocalDateTime createdAt;

    public static ApplicationResponse from(PolicyApplication app) {
        ApplicationResponse dto = new ApplicationResponse();
        dto.setId(app.getId());
        if (app.getCustomer() != null) {
            dto.setCustomerId(app.getCustomer().getId());
            dto.setCustomerName(app.getCustomer().getName());
            dto.setCustomerEmail(app.getCustomer().getEmail());
        }
        if (app.getInsurancePackage() != null) {
            dto.setPackageId(app.getInsurancePackage().getId());
            dto.setPackageName(app.getInsurancePackage().getName());
            dto.setPackageType(app.getInsurancePackage().getType());
        }
        if (app.getAgent() != null) {
            dto.setAgentId(app.getAgent().getId());
            dto.setAgentName(app.getAgent().getName());
        }
        dto.setCoverageAmount(app.getCoverageAmount());
        dto.setDuration(app.getDuration());
        dto.setStatus(app.getStatus().name());
        dto.setNotes(app.getNotes());
        dto.setAgentNote(app.getAgentNote());
        dto.setAdminNote(app.getAdminNote());
        dto.setCreatedAt(app.getCreatedAt());
        return dto;
    }
}
