---
name: Multi-period advance payment and policy expiry
description: Architecture for batch premium payments, policy EXPIRED status, and real-time countdown timers.
---

## Multi-Period / Advance Payment

**Backend (`CustomerController.submitPayment`)**
- Added `periodsJson` (`@RequestParam String`) — JSON array of period numbers e.g. `"[1,2,3]"`
- When `periodsJson` is present, creates one `Payment` record per period (same screenshotPath, same transaction)
- Duplicate transaction check is scoped to OTHER applications for multi-period batches; uses `PaymentRepository.existsByTransactionLastSixDigitsAndStatusNotAndApplication_IdNot`
- Period labels auto-computed by `PremiumScheduleUtil.buildPeriodLabel()` (made public) using `startDate + (n-1)*intervalMonths`
- Returns `List<PaymentResponse>` for multi-period, single `PaymentResponse` for single-period

**Frontend (`MyPaymentsPage.jsx`)**
- `PolicyScheduleCard` gets "Pay Multiple" toggle button → `multiSelectMode` state + `selectedPeriodNums` Set
- All UPCOMING/DUE/OVERDUE rows become checkable when multiSelectMode is on (click row or checkbox)
- Blue "Pay X Period(s) — TOTAL MMK" bar appears at card bottom when selection non-empty
- `openModal` accepts `selectedPeriods: [{periodNumber, periodLabel}]` array
- `PaymentModal` amount banner switches to multi-period display (labels list + period count × amount)
- `handleSubmitPayment` sends `periodsJson` when selectedPeriods.length > 1

**Why:** Customers prepay future installments with one screenshot/transaction. Each period still needs its own Payment record for the admin schedule to track it correctly.

**How to apply:** `PremiumScheduleUtil.buildPeriodLabel` is now `public static`; call it whenever you need a display label for a given period number.

## Policy EXPIRED Status

**Backend**
- `ApplicationStatus.EXPIRED` added to enum (stored as VARCHAR — no DB migration needed)
- `AutoCheckService.runDailyPolicyExpiry()` — iterates all APPROVED apps, computes `maturityDate = approvedAt.toLocalDate().plusYears(duration)`, sets status EXPIRED and sends INFO notification if maturityDate <= today
- Registered in `DynamicSchedulerService.rescheduleAll()` as `POLICY_EXPIRY` with hardcoded cron `0 0 0 * * *` (midnight daily, tied to enabled flag)
- `CustomerController.getActivePolicies` also fetches EXPIRED apps; adds `approvedAt` and `maturityDate` (computed) to the response map

**Frontend (`CustomerPoliciesPage.jsx`)**
- `PolicyCountdown` standalone component: `useEffect` setInterval 1s tick, shows `Xy Xmo Xd hh:mm:ss remaining` color-coded by urgency (blue→amber→red), shows "Expired" if ms ≤ 0
- `renderExpiredCard` renders EXPIRED policies in their own section with red "Expired" badge
- "Time Remaining" row added to the stats grid of active policy cards; `PolicyCountdown` renders inline
- Separate "Expired Policies" section at the bottom of the policies page
- `expiredPolicies` filter added alongside `activePolicies` and `usedPolicies`
