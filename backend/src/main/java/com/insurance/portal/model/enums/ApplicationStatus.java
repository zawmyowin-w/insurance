package com.insurance.portal.model.enums;

public enum ApplicationStatus {
    PENDING, VERIFIED, APPROVED, REJECTED, CANCELLED, REVISION_REQUESTED,
    /** Policy has had a claim approved — no further claims allowed. */
    CLAIMED,
    /** Policy has reached its maturity date (approvedAt + duration years). */
    EXPIRED
}
