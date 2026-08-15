package com.insurance.portal.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PremiumScheduleResponse {
    private Long applicationId;
    private String policyNumber;
    private String packageName;
    private String packageType;
    private String paymentFrequency;
    private Integer paymentIntervalMonths;
    private BigDecimal installmentAmount;
    private BigDecimal totalPremium;
    private int totalInstallments;
    private long paidCount;
    private List<InstallmentEntry> schedule;

    /** Date from which the customer can file claims (null = immediately). */
    private java.time.LocalDate claimEligibleFrom;

    /** Package-level claim waiting period in months (null or 0 = no waiting). */
    private Integer claimWaitingPeriodMonths;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InstallmentEntry {
        private int periodNumber;
        private String periodLabel;
        private LocalDate dueDate;
        private BigDecimal amount;
        /** PAID, PENDING_VERIFICATION, DUE, OVERDUE, UPCOMING */
        private String status;
        private Long paymentId;
        private String paymentStatus; // PENDING, VERIFIED, REJECTED (if payment exists)
        /**
         * Name of the customer who actually submitted this payment.
         * Non-null only when the policy was transferred and the payment was made by
         * the previous owner (i.e. different from the current application customer).
         */
        private String paidByName;
        private Long paidByCustomerId;
    }
}
