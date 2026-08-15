package com.insurance.portal.dto;

import com.insurance.portal.model.Payment;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class PaymentResponse {
    private Long id;
    private Long applicationId;
    private String policyNumber;
    private String policyName;
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private BigDecimal amount;           // per-period installment amount
    private BigDecimal transactionAmount; // total amount customer actually transferred
    private String transactionLastSixDigits;
    private String paymentType;
    private String paymentMethod;
    private boolean hasScreenshot;
    private String status;
    private String notes;
    private Integer periodNumber;
    private String periodLabel;
    private String verifiedBy;
    private LocalDateTime createdAt;

    // ── Batch fields ──────────────────────────────────────────────────────────
    /** UUID shared by all Payment records in the same multi-period batch. Null for single payments. */
    private String batchRef;
    /** How many periods are covered in this batch (1 for single payments). */
    private int batchSize;
    /** All periods covered by this batch, ordered by periodNumber. */
    private List<BatchPeriod> batchPeriods;
    /** All Payment IDs that belong to this batch (used for batch verify/reject). */
    private List<Long> batchIds;
    /** Total expected amount for the whole batch (installmentAmount × batchSize). */
    private BigDecimal batchTotalAmount;

    @Data
    public static class BatchPeriod {
        private Integer periodNumber;
        private String periodLabel;
        public BatchPeriod(Integer num, String label) {
            this.periodNumber = num;
            this.periodLabel  = label;
        }
    }

    /** Build from a single Payment record (single-period or legacy). */
    public static PaymentResponse from(Payment p) {
        PaymentResponse dto = new PaymentResponse();
        dto.setId(p.getId());
        if (p.getApplication() != null) {
            dto.setApplicationId(p.getApplication().getId());
            dto.setPolicyNumber(p.getApplication().getPolicyNumber());
            if (p.getApplication().getInsurancePackage() != null) {
                dto.setPolicyName(p.getApplication().getInsurancePackage().getName());
            }
        }
        if (p.getCustomer() != null) {
            dto.setCustomerId(p.getCustomer().getId());
            dto.setCustomerName(p.getCustomer().getName());
            dto.setCustomerEmail(p.getCustomer().getEmail());
        }
        dto.setAmount(p.getAmount());
        dto.setTransactionAmount(p.getTransactionAmount());
        dto.setTransactionLastSixDigits(p.getTransactionLastSixDigits());
        dto.setPaymentType(p.getPaymentType());
        dto.setPaymentMethod(p.getPaymentMethod());
        dto.setHasScreenshot(p.getScreenshotPath() != null && !p.getScreenshotPath().isBlank());
        dto.setStatus(p.getStatus().name());
        dto.setNotes(p.getNotes());
        dto.setPeriodNumber(p.getPeriodNumber());
        dto.setPeriodLabel(p.getPeriodLabel());
        dto.setVerifiedBy(p.getVerifiedBy());
        dto.setCreatedAt(p.getCreatedAt());
        dto.setBatchRef(p.getBatchRef());
        // Single-payment batch fields
        dto.setBatchSize(1);
        dto.setBatchPeriods(p.getPeriodNumber() != null
            ? List.of(new BatchPeriod(p.getPeriodNumber(), p.getPeriodLabel()))
            : List.of());
        dto.setBatchIds(List.of(p.getId()));
        dto.setBatchTotalAmount(p.getTransactionAmount());
        return dto;
    }

    /**
     * Build a consolidated response from multiple Payment records belonging to the same batch.
     * The first record (sorted by periodNumber) supplies the representative ID and metadata.
     */
    public static PaymentResponse fromBatch(List<Payment> batch) {
        if (batch == null || batch.isEmpty()) throw new IllegalArgumentException("Empty batch");
        // Sort by period number for deterministic ordering
        List<Payment> sorted = batch.stream()
            .sorted(java.util.Comparator.comparingInt(p -> (p.getPeriodNumber() != null ? p.getPeriodNumber() : 0)))
            .toList();
        Payment first = sorted.get(0);

        PaymentResponse dto = new PaymentResponse();
        // Representative record — use first payment ID so screenshot lookup still works
        dto.setId(first.getId());
        if (first.getApplication() != null) {
            dto.setApplicationId(first.getApplication().getId());
            dto.setPolicyNumber(first.getApplication().getPolicyNumber());
            if (first.getApplication().getInsurancePackage() != null) {
                dto.setPolicyName(first.getApplication().getInsurancePackage().getName());
            }
        }
        if (first.getCustomer() != null) {
            dto.setCustomerId(first.getCustomer().getId());
            dto.setCustomerName(first.getCustomer().getName());
            dto.setCustomerEmail(first.getCustomer().getEmail());
        }
        dto.setAmount(first.getAmount()); // per-period installment
        dto.setTransactionAmount(first.getTransactionAmount()); // total the customer transferred
        dto.setTransactionLastSixDigits(first.getTransactionLastSixDigits());
        dto.setPaymentType(first.getPaymentType());
        dto.setPaymentMethod(first.getPaymentMethod());
        dto.setHasScreenshot(first.getScreenshotPath() != null && !first.getScreenshotPath().isBlank());
        // Aggregate status: if any is PENDING → PENDING; else pick first's status
        String aggStatus = sorted.stream().anyMatch(p -> "PENDING".equals(p.getStatus().name()))
            ? "PENDING" : first.getStatus().name();
        dto.setStatus(aggStatus);
        dto.setNotes(first.getNotes());
        // Period label — combined label for the batch ("Jan 2026, Feb 2026, Mar 2026")
        String combinedLabel = sorted.stream()
            .map(p -> p.getPeriodLabel() != null ? p.getPeriodLabel() : "Period " + p.getPeriodNumber())
            .collect(java.util.stream.Collectors.joining(", "));
        dto.setPeriodNumber(first.getPeriodNumber());
        dto.setPeriodLabel(combinedLabel);
        dto.setVerifiedBy(first.getVerifiedBy());
        dto.setCreatedAt(first.getCreatedAt());

        // Batch metadata
        dto.setBatchRef(first.getBatchRef());
        dto.setBatchSize(sorted.size());
        dto.setBatchPeriods(sorted.stream()
            .map(p -> new BatchPeriod(p.getPeriodNumber(), p.getPeriodLabel()))
            .toList());
        dto.setBatchIds(sorted.stream().map(Payment::getId).toList());
        BigDecimal perPeriod = first.getAmount() != null ? first.getAmount() : BigDecimal.ZERO;
        dto.setBatchTotalAmount(perPeriod.multiply(BigDecimal.valueOf(sorted.size())));
        return dto;
    }
}
