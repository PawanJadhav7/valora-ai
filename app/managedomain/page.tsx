import Link from "next/link";

export default function ManageDomainPage() {
  return (
    
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-4">
        <h1 className="text-xl font-semibold">Manage Domain</h1>

        <p className="text-sm text-muted-foreground">
          Select a business domain to continue.
        </p>

        <div className="flex gap-3 pt-2">
          <Link
            href="/finance"
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted/50 text-sm"
          >
            Finance
          </Link>

          <Link
            href="/ecommerce"
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted/50 text-sm"
          >
            E-commerce
          </Link>

          <Link
            href="/saas"
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted/50 text-sm"
          >
            SaaS
          </Link>
        </div>
      </div>
    </div>
  );
}