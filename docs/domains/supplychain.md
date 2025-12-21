---

## `docs/domains/supply-chain.md`

```md
# Supply Chain Domain

Valora AI’s Supply Chain module turns shipment-level data into reliability, delay pressure, and network complexity insights.

## Required datasets (minimum)
Upload one or more CSVs with **one row per shipment** (or delivery record).

**Strongly recommended columns**
- `shipment_id` (or `order_id`)
- `ship_date` / `order_date`
- `expected_delivery_date`
- `actual_delivery_date`

**Optional columns**
- `sku` / `product_id`
- `units` / `quantity`
- `origin` / `origin_location`
- `destination` / `destination_location`

## Core KPIs
- shipments_count
- total_units
- avg_units_per_shipment
- on_time_delivery_rate
- delay_rate
- high_delay_share
- unique_skus
- unique_locations
- avg_delay_days

## Diagnostics summary (recommended 9 indicators)
Designed to be executive-grade and operational:
1. Delivery reliability (on-time + delay rate)
2. Delay pressure (late shipments share)
3. Delay severity (avg delay days)
4. High-delay exposure (share above threshold)
5. Shipment intensity (shipments/day)
6. Unit density (avg units per shipment)
7. SKU complexity (shipments per SKU)
8. Location dispersion (shipments per location)
9. Time coverage (date range)

## Common issues & fixes
- **Dates missing** → reliability/coverage degrade.
- **Expected vs actual missing** → on-time and delay metrics become unavailable.
- **Locations missing** → network complexity signals degrade.

## Example “good” CSV schema
```csv
shipment_id,ship_date,expected_delivery_date,actual_delivery_date,sku,units,origin,destination