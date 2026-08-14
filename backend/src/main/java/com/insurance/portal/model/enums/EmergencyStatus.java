package com.insurance.portal.model.enums;

public enum EmergencyStatus {
    /** Premium Waiver Benefit has not been activated — default state. */
    NONE,
    /** Customer has submitted an emergency declaration; admin review pending. */
    PENDING,
    /** Admin approved the emergency declaration — future premiums are waived. */
    APPROVED,
    /** Admin rejected the emergency declaration. */
    REJECTED
}
