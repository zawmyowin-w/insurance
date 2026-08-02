package com.insurance.portal.model;

import com.insurance.portal.model.enums.TransferStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Represents a policy ownership transfer request from one customer to another.
 *
 * Flow:
 *   1. fromCustomer submits → PENDING_TRANSFEREE_SIGNATURE  (notifies toCustomer)
 *   2. toCustomer accepts & signs → PENDING_ADMIN_APPROVAL  (notifies admin)
 *   3. Admin approves → APPROVED  (application.customer changes, payments re-assigned)
 *      Admin rejects → REJECTED   (notifies both parties)
 */
@Entity
@Table(name = "policy_transfers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PolicyTransfer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The policy/application whose ownership is being transferred. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private PolicyApplication application;

    /** Current owner initiating the transfer. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_customer_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User fromCustomer;

    /** Recipient of the policy. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_customer_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User toCustomer;

    /** Relationship between the two parties (e.g. Spouse, Child, Sibling). */
    @Column(nullable = false, length = 100)
    private String relationship;

    /** Reason for transferring ownership. */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TransferStatus status = TransferStatus.PENDING_TRANSFEREE_SIGNATURE;

    /** Digital signature of the original owner. */
    @Column(name = "from_signature", columnDefinition = "LONGTEXT")
    private String fromSignature;

    @Column(name = "from_signed_at")
    private LocalDateTime fromSignedAt;

    /** Digital signature of the new owner (signed when they accept). */
    @Column(name = "to_signature", columnDefinition = "LONGTEXT")
    private String toSignature;

    @Column(name = "to_signed_at")
    private LocalDateTime toSignedAt;

    /** Note from admin when approving/rejecting. */
    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
