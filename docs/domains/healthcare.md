---

## `docs/domains/healthcare.md`

```md
# Healthcare Domain

Valora AI’s Healthcare module provides claims-level KPIs and a diagnostics summary focused on denials, high-cost intensity, provider concentration, utilization, and billing efficiency.

## Required datasets (minimum)
Upload one or more CSVs with **one row per claim** (or service line if consistent).

**Strongly recommended columns**
- `claim_id`
- `patient_id`
- `provider_id`
- `paid_amount` (or `total_paid`)
- `charged_amount` (or `total_charged`)
- `claim_status` / `denied_flag` (or something that indicates denials)

## Core KPIs
- Claims count
- Total paid
- Total charged
- Avg paid per claim
- Denial rate
- High-cost share
- Unique patients
- Top-10 provider paid share

## Diagnostics summary (9 indicators)
The diagnostics are designed to avoid duplicating KPI tiles and instead explain operational “pressure”:
1. Denial pressure (denial rate badge)
2. Billing efficiency (paid ÷ charged)
3. Provider concentration (top-10 provider share)
4. High-cost intensity (high-cost share)
5. Claims per patient (utilization depth)
6. Paid per patient (cost intensity per member)
7. Charge per claim
8. Denial burden (charged × denial rate)
9. Paid-to-charge gap (1 − paid/charged)

## What “Billing efficiency” means
It’s a proxy for reimbursement effectiveness:
- Higher paid/charged = better realization
- Lower paid/charged = more write-offs/denials/underpayment

## Common issues & fixes
- **Charged missing** → Billing efficiency becomes unavailable.
- **Denials missing** → Denial pressure becomes neutral.
- **Patient/provider IDs missing** → Concentration and per-patient metrics degrade.

## Example “good” CSV schema
```csv
claim_id,claim_date,patient_id,provider_id,charged_amount,paid_amount,denied_flag