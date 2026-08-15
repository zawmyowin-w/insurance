package com.insurance.portal.model;

import com.insurance.portal.model.enums.ApplicationStatus;
import com.insurance.portal.model.enums.EmergencyStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "policy_applications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PolicyApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private InsurancePackage insurancePackage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User agent;

    @Column(name = "coverage_amount", nullable = false, precision = 20, scale = 2)
    private BigDecimal coverageAmount;

    @Column(nullable = false)
    private Integer duration; // numeric value (unit determined by durationUnit)

    /**
     * Unit for the duration field: YEARS (default/legacy), MONTHS, WEEKS.
     */
    @Column(name = "duration_unit", length = 10)
    @Builder.Default
    private String durationUnit = "YEARS";

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String notes; // customer notes

    @Column(name = "agent_note", columnDefinition = "TEXT")
    private String agentNote;

    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote;

    @Column(name = "revision_deadline")
    private LocalDateTime revisionDeadline;

    /** Risk level calculated at submission: LOW / MEDIUM / HIGH */
    @Column(name = "risk_level", length = 10)
    private String riskLevel;

    /** Auto-generated policy reference number, e.g. POL-LIF-2026-123456 */
    @Column(name = "policy_number", length = 50)
    private String policyNumber;

    /** JSON: customer personal details (name, NRC, DOB, etc.) — legacy field */
    @Column(name = "common_info", columnDefinition = "TEXT")
    private String commonInfo;

    /** JSON: plan-specific fields (beneficiary, vehicle info, etc.) — legacy field */
    @Column(name = "extra_info", columnDefinition = "TEXT")
    private String extraInfo;

    /**
     * JSON: dynamic form submission data.
     * Format: { "fieldId": "value", ... }
     * For IMAGE_UPLOAD/PDF_UPLOAD fields: value is the server-stored file path.
     * For CHECKBOX fields: value is a JSON array of selected option strings.
     */
    @Column(name = "form_data", columnDefinition = "TEXT")
    private String formData;

    /** Browser-drawn signature captured when the assigned agent verifies the form. */
    @Column(name = "agent_signature", columnDefinition = "LONGTEXT")
    private String agentSignature;

    @Column(name = "agent_signed_at")
    private LocalDateTime agentSignedAt;

    /** Browser-drawn signature captured when an admin approves the application. */
    @Column(name = "admin_signature", columnDefinition = "LONGTEXT")
    private String adminSignature;

    @Column(name = "admin_signed_at")
    private LocalDateTime adminSignedAt;

    /** Calculated total premium amount */
    @Column(name = "premium_amount", precision = 20, scale = 2)
    private BigDecimal premiumAmount;

    /** Admin who approved this application (set when status transitions to APPROVED) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User approvedBy;

    /** Timestamp when the application was approved by admin */
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    /**
     * Date from which the customer is eligible to submit a claim.
     * Set automatically when the first payment is verified by admin,
     * calculated as: firstPaymentVerifiedDate + package.claimWaitingPeriodMonths.
     * Null means no waiting period was configured (claims allowed immediately after payment).
     * Also reset when a policy transfer is approved (new owner serves the waiting period again).
     */
    @Column(name = "claim_eligible_from")
    private LocalDate claimEligibleFrom;

    /**
     * Set when an admin approves a policy transfer. Non-null means this policy
     * was transferred at least once; the customer field reflects the current owner.
     */
    @Column(name = "transferred_at")
    private LocalDateTime transferredAt;

    /** JSON array of server-stored paths for uploaded supporting documents */
    @Column(name = "documents_path", columnDefinition = "TEXT")
    private String documentsPath;

    // ── Premium Waiver Benefit (PWB) fields ────────────────────────────
    /** Emergency status for the PWB process. Default = NONE (no emergency declared). */
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "emergency_status", length = 20)
    private EmergencyStatus emergencyStatus = EmergencyStatus.NONE;

    /** JSON form data submitted by the customer in the emergency declaration form. */
    @Column(name = "emergency_form_data", columnDefinition = "TEXT")
    private String emergencyFormData;

    /** Customer's digital signature at the time of emergency form submission. */
    @Column(name = "customer_emergency_signature", columnDefinition = "LONGTEXT")
    private String customerEmergencySignature;

    @Column(name = "customer_emergency_signed_at")
    private LocalDateTime customerEmergencySignedAt;

    /** Admin's digital signature when approving the waiver. */
    @Column(name = "admin_waiver_signature", columnDefinition = "LONGTEXT")
    private String adminWaiverSignature;

    @Column(name = "admin_waiver_signed_at")
    private LocalDateTime adminWaiverSignedAt;

    /** Timestamp when admin approved the waiver. */
    @Column(name = "waiver_granted_at")
    private LocalDateTime waiverGrantedAt;

    /**
     * Payment schedule chosen by the customer at apply-time.
     * If null, falls back to the package's default paymentFrequency.
     * Values: MONTHLY, QUARTERLY, HALF_YEARLY, YEARLY, PAY_ALL
     */
    @Column(name = "selected_payment_frequency", length = 20)
    private String selectedPaymentFrequency;

    /**
     * Interval in months corresponding to selectedPaymentFrequency.
     * PAY_ALL → total duration months (1 installment).
     */
    @Column(name = "selected_payment_interval_months")
    private Integer selectedPaymentIntervalMonths;

    /**
     * Set to true when the customer submits a revision for the current revision cycle.
     * Reset to false whenever admin or agent creates a new revision request.
     * Prevents customers from editing more than once per revision cycle.
     */
    @Builder.Default
    @Column(name = "customer_edited_since_revision")
    private boolean customerEditedSinceRevision = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "application", fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Claim> claims;

    @OneToMany(mappedBy = "application", fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Payment> payments;
}
