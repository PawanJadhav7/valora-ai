---

## `docs/domains/insurance.md`

```md
# Insurance Domain

Valora AI’s Insurance module converts claims and premium data into underwriting-style KPIs and an executive diagnostics summary covering loss performance, frequency, severity, and concentration.

## Required datasets (minimum)
Upload one or more CSVs with **one row per claim**.

**Strongly recommended columns**
- `claim_amount` (or `paid_amount`, `incurred_amount`, `loss_amount`)
- `policy_id` (or `policy_number`)
- `claim_status` (open/closed/pending)

**Optional columns**
- `premium` (written/earned)
- `is_fraud` / `fraud_flag`
- `fraud_rule` / `fraud_reason`

## Core KPIs (current implementation)
From `computeInsuranceKPIs`:
- claims_count
- total_claims
- total_premium
- avg_claim_amount
- loss_ratio
- open_claim_rate
- fraud_rate
- high_severity_share (≥ 25k)
- unique_policies
- policy_concentration_top10

## Diagnostics summary (recommended set)
Diagnostics are meant to complement KPI tiles:
- Loss ratio / underwriting performance
- Claims frequency proxy (claims per policy)
- Average severity
- Large-loss share (high severity share)
- Policy holder concentration (top-10 policy share)
- Operational backlog / open claims
- Time coverage (based on claim dates if available)
- Claim velocity (claims per day)
- Premium realism checks (only if premium is present)

## Notes on thresholds
Thresholds (e.g., “High severity ≥ 25k”) are v1 defaults. You can later make these:
- percentile-based
- line-of-business specific
- state/product specific

## Common issues & fixes
- **Premium not present** → Loss ratio may be 0; upload premium to unlock it.
- **Status values vary** → Normalize statuses (“open”, “pending”, “in review”) for best open-rate results.
- **Policy ID missing** → Concentration and frequency per policy degrade.

## Example “good” CSV schema
```csv
claim_id,claim_date,policy_id,claim_amount,premium,claim_status,is_fraud,fraud_rule