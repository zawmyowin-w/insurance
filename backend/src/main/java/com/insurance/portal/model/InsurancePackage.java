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

    @Column(name = "premium_rate", nullable = false, precision = 8, scale = 4)
    private BigDecimal premiumRate; // e.g. 0.0200 = 2%

    @Column(name = "durations")
    private String durationsJson; // e.g. "[1,2,3,5]"

    @Column(name = "benefits", columnDefinition = "TEXT")
    private String benefitsJson; // JSON array

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
