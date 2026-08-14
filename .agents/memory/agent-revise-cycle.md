---
name: Agent revise + one-edit-per-cycle
description: How agent-initiated revision and the customer one-edit-per-cycle guard work end-to-end
---

## Rule
- `PolicyApplication` and `Claim` both carry a `customerEditedSinceRevision` boolean (default false).
- This flag is **reset to false** whenever admin OR agent creates a new revision (`AdminApplicationService.revise`, `AdminClaimService.revise`, `AgentController.requestApplicationRevision`, `AgentController.requestClaimRevision`).
- This flag is **set to true** when the customer submits their revision (`CustomerController.reviseApplication`, `CustomerController.reviseClaim`).
- The customer endpoint returns HTTP 400 if `REVISION_REQUESTED` and flag is already true.
- Both `ApplicationResponse` and `ClaimResponse` DTOs expose `customerEditedSinceRevision` for the frontend.

## Agent review flow
- **PENDING apps/claims**: agent sees Verify + Reject + new **Revise** button. Revise transitions to REVISION_REQUESTED.
- **REVISION_REQUESTED**: this was admin-initiated; agent sees **only "Forward to Customer"** (no Verify/Reject).
- `AgentController.requestApplicationRevision` now accepts both PENDING and REVISION_REQUESTED as valid source statuses.

## Why
Previously agents could only revise if the app was already REVISION_REQUESTED (admin-initiated). Now agents can initiate revision from PENDING themselves.

## DB migration
```sql
ALTER TABLE policy_applications ADD COLUMN customer_edited_since_revision TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE claims ADD COLUMN customer_edited_since_revision TINYINT(1) NOT NULL DEFAULT 0;
```
Added to `start-backend.sh` inside a `set +e` block.
