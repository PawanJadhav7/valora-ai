# Copilot / AI agent instructions — data-insights-ui

Purpose
- Provide focused, actionable guidance for code generation and edits in this repo.

Big picture
- This is a Next.js (App Router) UI project: routes and pages live under `app/` ([app/layout.tsx](app/layout.tsx), [app/page.tsx](app/page.tsx)).
- UI primitives live in `components/ui/` (e.g. [components/ui/button.tsx](components/ui/button.tsx), [components/ui/card.tsx](components/ui/card.tsx)). Follow existing component composition patterns.
- Small utility library in [lib/utils.ts](lib/utils.ts): use `cn()` and `class-variance-authority` (`cva`) for class merging/variants.

Key patterns to follow
- Design-system primitives: components export named slots (e.g., `Card`, `CardHeader`, `CardContent`) and accept `className` for styling composition. Keep that API.
- Styling: Tailwind classes + `cn()` and `cva` are the canonical approach. Avoid introducing inline styles where Tailwind suffices.
- Radix wrappers: interactive primitives (Select, ScrollArea, Tabs) wrap Radix components. When adding Radix-based components, mark files with `"use client"` if the primitive requires client behavior.
- Icons: use `lucide-react` consistently for iconography.
- File aliases: imports use `@/` to reference repo root (see `tsconfig.json` paths).

Developer workflows
- Run locally: `npm run dev` (uses `next dev`). Build: `npm run build`. Lint: `npm run lint`.
- TypeScript: strict mode enabled. Keep types accurate and export small helper types where useful.
- No tests detected: avoid adding test infra unless requested.

Integration notes
- Charts are placeholders in [app/data-insights-dashboard.tsx](app/data-insights-dashboard.tsx) — the UI expects to receive chart data from a backend or a client-side data layer. There are no API routes in the repo; wire external APIs or Next.js API routes as needed.

When making changes
- Preserve public component APIs. e.g., `Button` exposes `variant` and `size` variants via `buttonVariants` — extend variants carefully.
- Prefer adding new small, focused components under `components/ui/` and reuse `cn()` + `cva` patterns.
- For new interactive components using Radix or DOM APIs, add `"use client"` at top and follow patterns in `components/ui/select.tsx`.
- Update `app/layout.tsx` only for global layout or head metadata changes.

Files to inspect for context
- [app/data-insights-dashboard.tsx](app/data-insights-dashboard.tsx) — main dashboard layout and component usage examples
- [app/dashboard/page.tsx](app/dashboard/page.tsx) — another dashboard route, includes helper components and `use client`
- [components/ui/*](components/ui/) — canonical component patterns
- [lib/utils.ts](lib/utils.ts) — `cn()` helper
- [package.json](package.json) and [tsconfig.json](tsconfig.json) — scripts, dependencies, and path aliases

If you find an existing `.github/copilot-instructions.md` or AGENT file, merge preserving any project-specific notes. Ask maintainers when merging ambiguous guidance.

Questions for reviewer
- Anything missing or inaccurate about the app/data flow or preferred component APIs? Reply with specifics and I will update this file.
