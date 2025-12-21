---

## `docs/domains/finance.md`

```md
# Finance Domain

Valora AI’s Finance module summarizes transaction activity and highlights flow direction, risk posture, and behavioral signals like velocity and account density.

## Required datasets (minimum)
Upload one or more CSVs with **one row per transaction**.

**Strongly recommended columns**
- `amount` (or `txn_amount`, `value`)
- `account_id` (or `customer_id`)
- `txn_date` (or `transaction_date`, `date`, `posted_date`)

**Optional columns (risk signals)**
- `is_fraud` (boolean-ish)
- `fraud_rule` / `fraud_reason`
- `transaction_type` (credit/debit) if available

## Core KPIs
Computed from all valid Finance datasets:
- Transaction count
- Total inflow / total outflow
- Net cash flow
- Fraud rate (if flags exist)
- High-value transaction share
- Unique accounts

## Diagnostics summary (9 indicators)
The Finance diagnostics summary is built for fast decision-making:
1. Cash flow direction (Net inflow / Net outflow / Balanced)
2. Inflow / Outflow ratio
3. Risk posture (Low / Medium / Elevated)
4. Fraud rate
5. High-value share
6. Net cash flow
7. Transaction velocity (txns/day, based on time coverage)
8. Account activity density (txns/account)
9. Time coverage (max date − min date)

## How risk posture is derived
Risk posture is a simple composite of:
- fraud_rate
- high_value_txn_share

Thresholds are intentionally simple in v1; you can tune later.

## Common issues & fixes
- **Outflow sign confusion** → Outflow may be negative; Valora AI normalizes where needed.
- **Dates missing** → Coverage/velocity requires dates.
- **Fraud not present** → Fraud-related indicators become neutral/low.

## Example “good” CSV schema
```csv
txn_id,txn_date,account_id,amount,transaction_type,is_fraud,fraud_rule