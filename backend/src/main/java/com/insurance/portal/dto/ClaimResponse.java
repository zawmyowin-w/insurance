package com.insurance.portal.dto;

import com.insurance.portal.model.Claim;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ClaimResponse {
    private Long id;
    private Long customerId;
    private String customerName;
    private Long applicationId;
    private String policyName;
    private String agentName;
    private String claimType;
    private BigDecimal amount;
    private String description;
    private LocalDate incidentDate;
    private String status;
    private String agentNote;
    private String adminNote;
    private LocalDateTime createdAt;

    public static ClaimResponse from(Claim claim) {
        ClaimResponse dto = new ClaimResponse();
        dto.setId(claim.getId());
        if (claim.getCustomer() != null) {
            dto.setCustomerId(claim.getCustomer().getId());
            dto.setCustomerName(claim.getCustomer().getName());
        }
        if (claim.getApplication() != null) {
            dto.setApplicationId(claim.getApplication().getId());
            if (claim.getApplication().getInsurancePackage() != null) {
                dto.setPolicyName(claim.getApplication().getInsurancePackage().getName());
            }
        }
        if (claim.getAgent() != null) {
            dto.setAgentName(claim.getAgent().getName());
        }
        dto.setClaimType(claim.getClaimType());
        dto.setAmount(claim.getAmount());
        dto.setDescription(claim.getDescription());
        dto.setIncidentDate(claim.getIncidentDate());
        dto.setStatus(claim.getStatus().name());
        dto.setAgentNote(claim.getAgentNote());
        dto.setAdminNote(claim.getAdminNote());
        dto.setCreatedAt(claim.getCreatedAt());
        return dto;
    }
}
