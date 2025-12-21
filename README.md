# Valora AI

**Valora AI** is a data-driven analytics engine that turns raw CSV files into **executive-grade KPIs and diagnostic insights** across multiple business domains — without rigid schemas or manual modeling.

Upload data.  
Get answers.  
Understand *why* the numbers move.

---

## 🚀 What Valora AI Does (30-Second Overview)

Valora AI automatically detects your business domain and generates:

- **Core KPIs** (revenue, risk, utilization, growth)
- **Diagnostics summaries** with clear visual badges
- **Concentration, momentum, and stability signals**
- **Decision-ready insights**, not just charts

Supported domains today:

- 🛒 Ecommerce
- 💰 Finance
- 🏥 Healthcare
- 🛡 Insurance
- 📊 SaaS
- 🚚 Supply Chain

📄 Full domain documentation:  
➡️ [`/docs/domains`](./docs/domains)

---

## 🧠 Why Valora AI Is Different

- **CSV-first** — no strict schemas required
- **Auto-detection** of columns and domains
- **Executive logic baked in** (risk, pressure, concentration)
- **Badge-based interpretation** instead of raw numbers
- **Graceful degradation** when data is incomplete
- **Production-ready v1**, extensible to AI insights

Valora AI is not a dashboard.  
It is a **decision layer** on top of raw business data.

---

## 📊 Domains & Diagnostics

Each domain includes:
- KPI computation
- Diagnostic summary (3 × 3 grid)
- Risk & health badges
- Domain-specific logic

| Domain | Focus |
|------|------|
| Ecommerce | Revenue stability & customer behavior |
| Finance | Cash flow health & transaction risk |
| Healthcare | Denials, billing efficiency & cost intensity |
| Insurance | Loss ratio, severity & policy concentration |
| SaaS | Growth quality, churn & retention |
| Supply Chain | Delivery reliability & network complexity |

➡️ See full breakdown: [`docs/domains/README.md`](./docs/domains/README.md)

---

## 🛠 Tech Stack

- **Next.js (App Router)**
- **TypeScript**
- **React + Hooks**
- **Tailwind CSS**
- **CSV-driven analytics**
- **Modular KPI engines per domain**

---

## 🧪 Getting Started (Development)

This is a [Next.js](https://nextjs.org) project bootstrapped with
[`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

### Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev