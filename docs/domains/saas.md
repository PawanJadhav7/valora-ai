---

## `docs/domains/saas.md`

```md
# SaaS Domain

Valora AI’s SaaS module produces subscription-grade KPIs (MRR, churn, ARPU, expansion) and an executive diagnostics summary built around growth, retention, and revenue quality.

## Required datasets (minimum)
Upload one or more CSVs containing **subscription events** or **monthly customer revenue snapshots**.

**Strongly recommended columns**
- `customer_id` (or `account_id`)
- `date` / `month`
- `mrr` or `amount` (recurring revenue)
- `event_type` (new, expansion, contraction, churn) if event-based

## Core KPIs (from computeSaaSKPIs)
- MRR (current)
- Previous MRR
- Active customers
- ARPU
- Customer churn rate
- Revenue churn rate
- Expansion rate
- MRR growth rate
- Contraction rate
- Top-10 revenue share
- Expansion MRR / contraction MRR / churned MRR

## Diagnostics summary (recommended)
Diagnostics should emphasize “quality of growth,” not just totals:
1. Churn risk (customer churn rate)
2. MRR growth (growth badge)
3. Customer value (ARPU badge)
4. Net revenue retention (NRR proxy)
5. Expansion rate (separate from growth)
6. Revenue churn rate (quality)
7. Customer base size (active customers badge)
8. Top-10 revenue share (concentration risk)
9. Data coverage / recency (if months available)

## Growth vs Expansion (simple explanation)
- **Growth badge**: overall MRR direction (month-over-month change)
- **Expansion badge**: how much existing customers are upgrading (upsell)

A company can have strong expansion but flat overall growth if churn is high.

## Common issues & fixes
- **No month/date** → growth and churn become unreliable.
- **No event_type** → the engine infers churn/expansion heuristically (v1).
- **One-time payments** → keep recurring revenue separate for clean MRR.

## Example “good” CSV schema
```csv
month,customer_id,event_type,mrr_delta,mrr