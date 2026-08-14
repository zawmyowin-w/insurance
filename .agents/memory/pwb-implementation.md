---
name: Premium Waiver Benefit Implementation
description: Full architecture of the PWB feature — enums, models, controllers, frontend flow — for consistency on future extensions
---

## What PWB does
If a policy payer dies unexpectedly, the customer submits an emergency declaration.
Admin approves → all future installments are WAIVED → policy matures normally.
At maturity admin issues a maturity payout (PREMIUM_WAIVER Claim).

## Backend architecture

### New enums
- `FormType.EMERGENCY` — emergency declaration form template
- `PaymentStatus.WAIVED` — installment waived under PWB (no payment due)
- `EmergencyStatus` (`NONE/PENDING/APPROVED/REJECTED`) — on PolicyApplication

### New fields on InsurancePackage
- `premiumWaiverBenefit` (boolean, default false)

### New fields on PolicyApplication
- `emergencyStatus` (EnumType.STRING, default NONE)
- `emergencyFormData` (TEXT — JSON)
- `customerEmergencySignature` (LONGTEXT)
- `customerEmergencySignedAt`
- `adminWaiverSignature` (LONGTEXT)
- `adminWaiverSignedAt`
- `waiverGrantedAt`

### Endpoints
- `POST /customer/applications/{id}/emergency` — submit emergency declaration (customer)
- `POST /admin/applications/{id}/waiver/approve` — approve (AdminWaiverController)
- `POST /admin/applications/{id}/waiver/reject` — reject
- `POST /admin/applications/{id}/waiver/maturity-payout` — issue maturity payout

### Waiver approve logic
1. Sets emergencyStatus=APPROVED, waiverGrantedAt=now, adminWaiverSignature
2. Iterates all existing payments for the app → sets PENDING/REJECTED to WAIVED
3. Synthesizes WAIVED Payment records for installments with no payment row yet
4. Notifies customer

### Maturity payout logic
Creates Claim with claimType="PREMIUM_WAIVER", status=APPROVED, amount=coverageAmount
Sets application.status=CLAIMED

## Frontend flows

### Admin — ManagePackagesPage
- Section "Premium Waiver Benefit" (SectionHeader id="waiver") with toggle
- EMPTY/handleEdit/handleSubmit all include `premiumWaiverBenefit`
- pkgForms loads `EMERGENCY` form type badge
- AdminFormBuilderPage: EMERGENCY added to FORM_TYPES + formTypeMeta

### Admin — AdminApplicationsPage
- STATUS_KEYS includes 'EMERGENCY' (client-side filter: emergencyStatus===PENDING)
- Orange badge when emergencyStatus===PENDING
- Green "Waiver Active" badge when emergencyStatus===APPROVED
- Emergency review panel: shows emergencyFormData, signature canvas, Approve/Reject
- "Issue Maturity Payout" button when APPROVED+waiverGrantedAt set

### Customer — CustomerPoliciesPage
- EmergencyFormModal: fetches `/forms/public?packageId=...&formType=EMERGENCY`
  - Uses field.fieldLabel as key, field.fieldType for rendering, field.fieldOptions for SELECT
  - Falls back to free-text textarea if no template configured
- "Reinstate Benefit" button: shown for APPROVED policies + PWB=true + emergencyStatus NONE/REJECTED
- Waiver active banner (teal) when emergencyStatus===APPROVED
- Emergency pending banner (orange) when emergencyStatus===PENDING
- packageId added to customer /policies endpoint response

### Customer — MyClaimsPage
- PREMIUM_WAIVER claims: teal badge + "Policy matured under PWB" note
- PDF button still works (same endpoint)

### Schedules — all views
- WAIVED status: teal color (#0891b2), shield-heart icon, label "Waived"
- No Pay button for WAIVED (canPay = DUE||OVERDUE only)
- STATUS_COLORS/STATUS_META/STATUS_COLOR/STATUS_BG all updated in AdminPremiumSchedulePage + MyPaymentsPage

**Why:**
No new tables — all state lives on existing entities using new columns.
Hibernate auto-creates columns from new fields on next startup.
