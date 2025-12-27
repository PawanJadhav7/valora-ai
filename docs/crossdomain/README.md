# Cross-Domain Insight Engine (v1)

## What it is
The Cross-Domain Insight Engine is Valora AI’s intelligence layer that **connects signals across business domains** (Finance, SaaS, Supply Chain, Healthcare, Insurance, Ecommerce) to surface **second-order risks and opportunities**.

Instead of viewing KPIs in isolation, the engine answers:
> “What do these metrics mean *together*?”

---

## Why it matters
Most analytics tools stop at dashboards.
Valora AI goes further by:
- Linking financial, operational, and customer signals
- Detecting hidden risk propagation
- Explaining *why* a business outcome is changing

This is the foundation for:
- Executive decision support
- Automated narratives
- Future AI/LLM reasoning

---

## Core concept

### Insight = Correlation + Context + Explanation

Each insight is derived from:
1. **KPIs from multiple domains**
2. **Rule-based conditions (v1)**
3. **Human-readable interpretation**

---

## How it works (v1)

1. Domain-specific KPIs are computed independently (Finance, SaaS, Supply Chain, etc.)
2. KPIs are passed into the Cross-Domain Insight Engine as a unified context
3. A set of deterministic rules evaluate cross-domain conditions
4. Matching rules emit structured insights with:
   - Severity
   - Priority
   - Explanation
   - Recommended action
5. Top insights are ranked and surfaced in the executive dashboard

---


## Input Model

The engine consumes already-computed KPIs:

```ts
type CrossDomainInputs = {
  finance?: FinanceKPIs;
  saas?: SaaSKPIs;
  supply?: SupplyChainKPIs;
  healthcare?: HealthcareKPIs;
  insurance?: InsuranceKPIs;
  ecommerce?: EcommerceKPIs;
};
---

## Insight Output Model

Each cross-domain insight follows a strict schema:

```ts
type CrossDomainInsight = {
  id: string;
  severity: "Low" | "Medium" | "High";
  priority: "low" | "medium" | "high";
  cls: "emerald" | "amber" | "rose" | "slate";

  domains: string[];
  title: string;

  message: string;
  explanation: string;
  recommended_action?: string;

  facts?: { label: string; value: string }[];
};
---

## Versioning & Roadmap

### v1 (Current)
- Deterministic rule-based engine
- Fully explainable insights
- Cross-domain correlation
- Executive-grade narratives

### v2 (Planned)
- ML-assisted rule discovery
- Confidence scoring
- Temporal pattern detection
- LLM-assisted insight summarization

### v3 (Vision)
- Autonomous insight generation
- What-if simulations
- Prescriptive recommendations