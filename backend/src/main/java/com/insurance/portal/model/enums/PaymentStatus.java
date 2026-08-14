package com.insurance.portal.model.enums;

public enum PaymentStatus {
    PENDING,
    VERIFIED,
    REJECTED,
    /** Premium installment waived due to Premium Waiver Benefit — no payment required. */
    WAIVED
}
