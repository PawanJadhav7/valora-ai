# Valora AI — Domain Analytics Overview

Valora AI supports multiple business domains out of the box.  
Each domain transforms raw CSV data into **executive-grade KPIs** and a **diagnostics summary** designed for fast decision-making.

This folder documents how each domain works, what data it expects, and how insights are derived.

---

## Supported Domains

### 🛒 Ecommerce
**Focus:** Revenue stability, customer behavior, and concentration risk.

- Customer inactivity & retention signals
- Revenue concentration (top customers/products)
- Order volatility and demand stability
- Growth vs stagnation indicators

📄 Documentation:  
➡️ [`ecommerce.md`](./ecommerce.md)

---

### 💰 Finance
**Focus:** Cash flow health, transaction behavior, and risk posture.

- Net cash flow & flow direction
- Fraud exposure and high-value transaction risk
- Transaction velocity & account density
- Time coverage and behavioral stability

📄 Documentation:  
➡️ [`finance.md`](./finance.md)

---

### 🏥 Healthcare
**Focus:** Claims efficiency, denial pressure, cost intensity, and provider risk.

- Denial rate & denial burden
- Billing efficiency (paid vs charged)
- High-cost claim intensity
- Provider concentration & utilization depth

📄 Documentation:  
➡️ [`healthcare.md`](./healthcare.md)

---

### 🛡 Insurance
**Focus:** Underwriting performance, severity, frequency, and concentration.

- Loss ratio & claims severity
- Open claims backlog
- Fraud and high-severity exposure
- Policy concentration risk

📄 Documentation:  
➡️ [`insurance.md`](./insurance.md)

---

### 📊 SaaS
**Focus:** Growth quality, retention, and revenue durability.

- MRR, ARPU, and active customers
- Customer & revenue churn
- Expansion vs contraction
- Net revenue retention (NRR proxy)
- Revenue concentration (top customers)

📄 Documentation:  
➡️ [`saas.md`](./saas.md)

---

### 🚚 Supply Chain
**Focus:** Reliability, delay pressure, and network complexity.

- On-time delivery & delay rates
- High-delay exposure
- Shipment intensity & unit density
- SKU and location dispersion
- Coverage and operational scale

📄 Documentation:  
➡️ [`supply-chain.md`](./supply-chain.md)

---

## Design Philosophy (applies to all domains)

- **CSV-first**: No strict schemas — Valora AI auto-detects common columns
- **Executive-first**: Diagnostics explain *why* metrics matter
- **Badge-based interpretation**: Numbers → Meaning (Low / Watch / Risk)
- **Graceful degradation**: Missing columns reduce insight depth, not usability
- **Production-ready v1**: Simple thresholds now, extensible later

---

## What’s Next

- Root `README.md` (30-second product pitch)
- Cross-Domain Insight Engine documentation
- Rule engine & correlation logic
- AI-powered narrative insights (roadmap)

---

> Valora AI is not a dashboard.  
> It is a **decision layer** on top of raw business data.