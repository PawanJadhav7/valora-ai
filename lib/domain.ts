export type DomainKey =
  | "ecommerce"
  | "finance"
  | "healthcare"
  | "saas"
  | "insurance"
  | "supplychain";

export const DOMAINS: { key: DomainKey; label: string; href: string }[] = [
  { key: "ecommerce", label: "E-commerce", href: "/ecommerce" },
  { key: "finance", label: "Finance", href: "/finance" },
  { key: "healthcare", label: "Healthcare", href: "/healthcare" },
  { key: "saas", label: "SaaS", href: "/saas" },
  { key: "insurance", label: "Insurance", href: "/insurance" },
  { key: "supplychain", label: "Supply Chain", href: "/supplychain" },
];

export function labelForDomain(key: DomainKey) {
  return DOMAINS.find((d) => d.key === key)?.label ?? key;
}