package com.insurance.portal.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "insurance_packages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InsurancePackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String type; // LIFE, HEALTH, VEHICLE, PROPERTY

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "coverage_min", nullable = false, precision = 20, scale = 2)
    private BigDecimal coverageMin;

    @Column(name = "coverage_max", nullable = false, precision = 20, scale = 2)
    private BigDecimal coverageMax;

    @Column(name = "premium_rate", precision = 8, scale = 4)
    private BigDecimal premiumRate; // e.g. 0.0200 = 2% — legacy field; derived from first durationTier

    @Column(name = "benefits", columnDefinition = "TEXT")
    private String benefitsJson; // JSON array

    @Column(name = "exclusions", columnDefinition = "TEXT")
    private String exclusions; // what is not covered

    @Column(columnDefinition = "TEXT")
    private String eligibility; // eligibility requirements

    @Column(name = "min_policy_term")
    private Integer minPolicyTerm; // minimum policy term in years

    @Column(name = "policy_term")
    private Integer policyTerm; // maximum policy term in years

    // Duration-based premium tiers: JSON array [{years, premiumRate}]
    @Column(name = "duration_tiers", columnDefinition = "TEXT")
    private String durationTiersJson;

    // Payment schedule
    @Column(name = "payment_frequency", length = 20)
    private String paymentFrequency; // MONTHLY, QUARTERLY, HALF_YEARLY, YEARLY

    @Column(name = "payment_interval_months")
    private Integer paymentIntervalMonths; // e.g. 1=monthly, 3=quarterly, 6=half-yearly, 12=yearly

    // Maximum claimable amount
    @Column(name = "max_claim_amount", precision = 20, scale = 2)
    private BigDecimal maxClaimAmount;

    /**
     * Waiting period after first payment verification before a customer can submit a claim.
     * Null or 0 means claims can be submitted immediately after payment verification.
     */
    @Column(name = "claim_waiting_period_months")
    private Integer claimWaitingPeriodMonths;

    // Who can be a beneficiary
    @Column(name = "beneficiary_info", columnDefinition = "TEXT")
    private String beneficiaryInfo;

    // Required documents for application: JSON array of strings
    @Column(name = "required_documents", columnDefinition = "TEXT")
    private String requiredDocumentsJson;

    // Age-based premium bands: JSON array [{minAge, maxAge, premiumRate}]
    @Column(name = "age_bands", columnDefinition = "TEXT")
    private String ageBandsJson;

    // Terms, rules, and policy conditions
    @Column(name = "terms_and_conditions", columnDefinition = "TEXT")
    private String termsAndConditions;

    // ── Policy Transfer Eligibility ────────────────────────────────────
    /**
     * Whether ownership transfer is allowed for policies under this package.
     * If false, customers cannot initiate any transfer request.
     */
    @Builder.Default
    @Column(name = "transfer_allowed")
    private boolean transferAllowed = false;

    /**
     * Minimum number of years the policy must be active (since approvedAt)
     * before a transfer request is allowed.
     */
    @Column(name = "transfer_eligible_after_years")
    private Integer transferEligibleAfterYears;

    /**
     * Additional months (on top of transferEligibleAfterYears) before transfer is allowed.
     * Total minimum active period = transferEligibleAfterYears * 12 + transferEligibleAfterMonths months.
     */
    @Column(name = "transfer_eligible_after_months")
    private Integer transferEligibleAfterMonths;

    // ── Maturity / Policy Expiry Payout ──────────────────────────────────
    /**
     * Year-by-year bonus tiers at policy maturity.
     * JSON array: [{year, bonusPercent}]
     * e.g. [{year:1,bonusPercent:5.0},{year:3,bonusPercent:10.0}]
     * At maturity the applicable tier's bonusPercent of the claim coverage amount is paid as a bonus.
     */
    @Column(name = "maturity_bonus_tiers", columnDefinition = "TEXT")
    private String maturityBonusTiersJson;

    /**
     * If true, the total of all premiums paid (monthly/yearly) by the customer
     * over the policy lifetime is added to the maturity payout alongside the bonus.
     */
    @Builder.Default
    @Column(name = "maturity_includes_premiums", columnDefinition = "TINYINT(1) NOT NULL DEFAULT 0")
    private boolean maturityIncludesPremiums = false;

    /**
     * When true, customers holding policies under this package are entitled to
     * the Premium Waiver Benefit: if the policy payer dies unexpectedly, the
     * customer can submit an emergency declaration.  On admin approval, all
     * remaining premium installments are waived and the policy matures normally.
     */
    @Builder.Default
    @Column(name = "premium_waiver_benefit", columnDefinition = "TINYINT(1) NOT NULL DEFAULT 0")
    private boolean premiumWaiverBenefit = false;

    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "insurancePackage", fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<PolicyApplication> applications;
}
