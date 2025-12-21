# Ecommerce Domain

Valora AI’s Ecommerce module turns order-level data into executive-grade KPIs and diagnostics. It highlights revenue concentration risk, customer inactivity, and stability/volatility patterns.

## Required datasets (minimum)
Upload one or more CSVs with **one row per order**. Valora AI will auto-detect common column names.

**Strongly recommended columns**
- `order_date` (or `date`)
- `revenue` (or `amount`, `sales`, `total`)
- `customer_id` (or `customer`, `customerId`)

**Optional columns**
- `product_id` / `sku`
- `quantity` / `units`

## Core KPIs (examples)
- Total revenue
- Order count
- Average order value (AOV)
- Unique customers
- Repeat customer rate
- At-risk revenue (inactive customers)
- Revenue trend (monthly/last 6)
- Product revenue mix (top SKUs)

## Diagnostics summary (9 indicators)
The diagnostics panel is designed to feel “executive-grade” and uses badges for fast interpretation:
- Orders per customer
- Inactive customer share
- Top-1 customer revenue share
- Top-3 customer revenue share
- Revenue per customer trend (30d vs prior 30d)
- Weekly order volatility (CV)
- Revenue concentration / dependency signals
- Customer retention momentum
- Coverage/recency signals (based on dates)

## How badges work
Badges convert numeric metrics into simple labels (e.g., **Healthy / Watch / Risk**) using thresholds. Thresholds are intentionally simple in v1 and can be tuned later.

## Common issues & fixes
- **Dates not parsed** → Ensure `order_date` is ISO-like (YYYY-MM-DD) or recognizable by `new Date(...)`.
- **Revenue missing** → Use a column like `amount`, `sales`, or `total`.
- **Customer ID missing** → Use a stable identifier; otherwise, customer metrics degrade.

## Example “good” CSV schema
```csv
order_id,order_date,customer_id,revenue,sku,quantity