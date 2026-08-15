---
name: Duration unit + customer payment schedule selection
description: Duration tiers now support YEARS/MONTHS/WEEKS; customers choose payment schedule at apply time.
---

## Duration Tiers

**Old format:** `{years: 2, premiumRate: 2.0}`
**New format:** `{value: 2, unit: "YEARS", premiumRate: 2.0}` — unit can be YEARS, MONTHS, WEEKS

**Backward compat:** `PackageResponse.from()` normalises old `{years}` tiers to `{value, unit: "YEARS"}` on read.
`PolicyApplication` has `durationUnit` VARCHAR(10) DEFAULT 'YEARS'.
`PremiumScheduleUtil.durationToMonths(value, unit)` is the shared converter (also static helper).

**Premium calc:** `coverage × (rate/100) × durationInYears` where durationInYears = MONTHS→/12, WEEKS→/52, YEARS as-is.

## Customer-Selected Payment Schedule

Admin sets `allowedPaymentFrequencies` JSON array on package (e.g. `["MONTHLY","QUARTERLY","PAY_ALL"]`).
Customer selects one at apply time → stored as `selectedPaymentFrequency` + `selectedPaymentIntervalMonths` on `PolicyApplication`.
`PremiumScheduleUtil.buildSchedule()` prefers app's selected frequency over package default.
`PAY_ALL` → `totalInstallments = 1`, `installmentAmount = totalPremium`.

**Fallback:** if `allowedPaymentFrequencies` is empty, old `paymentFrequency` on package still works (legacy packages).

## Coverage Validation

Real-time validation in `ApplyPolicyPage.jsx`: `handleCoverageChange()` sets `coverageError` state.
Red border + error message shown inline; "Next" button disabled while error exists.

## DB Migrations (start-backend.sh)

```sql
ALTER TABLE policy_applications ADD COLUMN duration_unit VARCHAR(10) NOT NULL DEFAULT 'YEARS';
ALTER TABLE policy_applications ADD COLUMN selected_payment_frequency VARCHAR(20) NULL;
ALTER TABLE policy_applications ADD COLUMN selected_payment_interval_months INT NULL;
ALTER TABLE insurance_packages ADD COLUMN allowed_payment_frequencies TEXT NULL;
```

**Why:** All idempotent (fail silently), run before Hibernate ddl-auto=update.
