"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { housesKey, activeHouseKey } from "@/app/lib/clientStorage";

type House = {
  id: string;
  name: string;
  domain: string; // House = Domain
  createdAt: string;
  ownerEmail?: string;
};

const DOMAIN_OPTIONS = ["E-commerce", "SaaS", "Healthcare", "Insurance", "Supply Chain", "Finance"];

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function domainLabel(domain: string) {
  const d = (domain || "").toLowerCase();
  if (d.includes("ecomm")) return "E-commerce";
  if (d.includes("saas")) return "SaaS";
  if (d.includes("health")) return "Healthcare";
  if (d.includes("insur")) return "Insurance";
  if (d.includes("supply")) return "Supply Chain";
  if (d.includes("finance") || d.includes("bank")) return "Finance";
  return domain || "General";
}

// function badgeClass(domain: string) {
//   const d = (domain || "").toLowerCase();
//   if (d.includes("ecomm")) return "border-cyan-400/40 text-cyan-200 bg-cyan-500/10";
//   if (d.includes("saas")) return "border-emerald-400/40 text-emerald-200 bg-emerald-500/10";
//   if (d.includes("health")) return "border-violet-400/40 text-violet-200 bg-violet-500/10";
//   if (d.includes("insur")) return "border-amber-400/40 text-amber-200 bg-amber-500/10";
//   if (d.includes("supply")) return "border-sky-400/40 text-sky-200 bg-sky-500/10";
//   if (d.includes("finance") || d.includes("bank")) return "border-rose-400/40 text-rose-200 bg-rose-500/10";
//   return "border-slate-600 text-slate-200 bg-slate-900/60";
// }

function resolveDomainFromAny(h: any): string {
  // Migration support (Option B -> Option C)
  const d1 = typeof h?.domain === "string" ? h.domain : "";
  const d2 = typeof h?.activeDomain === "string" ? h.activeDomain : "";
  const d3 = Array.isArray(h?.domains) && h.domains.length ? String(h.domains[0]) : "";
  return domainLabel(d1 || d2 || d3 || "E-commerce");
}

function domainBadgeClasses(domain: string) {
  const d = domain.toLowerCase();

  if (d.includes("finance") || d.includes("bank"))
    return "border-blue-500/40 bg-blue-500/10 text-blue-200 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.35)]";

  if (d.includes("insurance"))
    return "border-indigo-500/40 bg-indigo-500/10 text-rose-200 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.35)]";

  if (d.includes("health"))
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:shadow-[0_0_0_1px_rgba(16,185,129,0.35)]";

  if (d.includes("supply"))
    return "border-amber-500/40 bg-amber-500/10 text-amber-200 hover:shadow-[0_0_0_1px_rgba(245,158,11,0.35)]";

  if (d.includes("saas"))
    return "border-purple-500/40 bg-purple-500/10 text-purple-200 hover:shadow-[0_0_0_1px_rgba(168,85,247,0.35)]";

  if (d.includes("e-comm") || d.includes("ecommerce"))
    return "border-cyan-400/40 bg-cyan-400/10 text-cyan-200 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.35)]";

  return "border-slate-700 bg-slate-900/70 text-slate-200";
}


function normalizeHouse(h: any): House | null {
  if (!h || typeof h !== "object") return null;

  const name = String(h.name ?? "").trim();
  const id = String(h.id ?? "").trim();
  if (!id || !name) return null;

  return {
    id,
    name,
    domain: resolveDomainFromAny(h),
    createdAt: String(h.createdAt ?? new Date().toISOString()),
    ownerEmail: h.ownerEmail ? String(h.ownerEmail) : undefined,
  };
}

export default function HousesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ When coming from dashboard "Manage Domains"
  const forceManage = searchParams?.get("manage") === "1";

  const [userEmail, setUserEmail] = React.useState<string | null>(null);
  const [houses, setHouses] = React.useState<Record<string, House>>({});
  const [activeHouseId, setActiveHouseId] = React.useState<string | null>(null);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newDomain, setNewDomain] = React.useState<string>("E-commerce");
  const [error, setError] = React.useState<string | null>(null);

  // ✅ prevents double redirect loops in dev (React Strict Mode)
  const hasRedirectedRef = React.useRef(false);

  function saveUserHouses(next: Record<string, House>, email: string) {
    localStorage.setItem(housesKey(email), JSON.stringify(next));
  }

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const sessionRaw = localStorage.getItem("valoraSessionV1");
    if (!sessionRaw) {
      router.replace("/signin");
      return;
    }

    try {
      const session = JSON.parse(sessionRaw);
      const email = String(session.email || "").toLowerCase();
      setUserEmail(email);

      const hk = housesKey(email);
      const ak = activeHouseKey(email);

      const housesRaw = localStorage.getItem(hk);
      const parsedAny: Record<string, any> = housesRaw ? JSON.parse(housesRaw) : {};

      const filtered: Record<string, House> = {};
      for (const [id, h] of Object.entries(parsedAny)) {
        const norm = normalizeHouse(h);
        if (!norm) continue;
        norm.ownerEmail = email;
        filtered[id] = norm;
      }

      setHouses(filtered);

      const ids = Object.keys(filtered);

      // ✅ Auto-skip only if NOT manage mode
      if (!forceManage && ids.length === 1 && !hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        localStorage.setItem(ak, ids[0]);
        router.replace("/dashboard");
        return;
      }

      // normal selection behavior
      const active = localStorage.getItem(ak);
      if (active && filtered[active]) {
        setActiveHouseId(active);
      } else {
        const first = ids[0] ?? null;
        setActiveHouseId(first);
        if (first) localStorage.setItem(ak, first);
      }
    } catch {
      router.replace("/signin");
    }
  }, [router, forceManage]);

  function handleOpenHouse(id: string) {
    setError(null);
    if (!houses[id] || !userEmail) return;

    localStorage.setItem(activeHouseKey(userEmail), id);
    setActiveHouseId(id);
    router.push("/dashboard");
  }

  function handleSignOut() {
    try {
      localStorage.removeItem("valoraSessionV1");
    } catch {}
    router.push("/");
  }

  function handleCreateHouse() {
    setError(null);
    if (!userEmail) {
      setError("Session missing. Please sign in again.");
      return;
    }

    const name = newName.trim();
    if (!name) {
      setError("Enter a house name.");
      return;
    }

    const domain = domainLabel(newDomain || "E-commerce");
    const id = `house_${slugify(name)}_${Math.random().toString(16).slice(2, 8)}`;

    const house: House = {
      id,
      name,
      domain,
      createdAt: new Date().toISOString(),
      ownerEmail: userEmail,
    };

    const updated = { ...houses, [id]: house };
    setHouses(updated);

    saveUserHouses(updated, userEmail);

    localStorage.setItem(activeHouseKey(userEmail), id);
    setActiveHouseId(id);

    setCreateOpen(false);
    setNewName("");
    setNewDomain("E-commerce");

    router.push("/dashboard");
  }

  function handleDeleteHouse(id: string) {
    setError(null);
    if (!houses[id] || !userEmail) return;

    const copy = { ...houses };
    delete copy[id];

    setHouses(copy);
    saveUserHouses(copy, userEmail);

    const remainingIds = Object.keys(copy);

    // if deleting active one, pick next (or clear)
    if (activeHouseId === id) {
      const next = remainingIds[0] ?? null;
      setActiveHouseId(next);

      if (next) {
        localStorage.setItem(activeHouseKey(userEmail), next);

        // ✅ auto-skip ONLY if not manage mode
        if (!forceManage && remainingIds.length === 1) {
          router.replace("/dashboard");
          return;
        }
      } else {
        localStorage.removeItem(activeHouseKey(userEmail));
      }
    } else {
      // even if not deleting active, if only one remains we can auto-skip (unless manage mode)
      if (!forceManage && remainingIds.length === 1) {
        localStorage.setItem(activeHouseKey(userEmail), remainingIds[0]);
        router.replace("/dashboard");
        return;
      }
    }
  }

  const houseList = Object.values(houses).sort((a, b) =>
    (b.createdAt || "").localeCompare(a.createdAt || "")
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-950/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center font-bold text-slate-950">
              V
            </div>
            <div>
              <div className="text-sm font-semibold">Valora AI</div>
              <div className="text-[11px] text-slate-400">
                {userEmail ? `Signed in as ${userEmail}` : "Workspace"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreateOpen(true)}
              className="h-9 px-3 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 hover:from-cyan-300 hover:to-emerald-300"
            >
              New house
            </button>
            <button
              onClick={handleSignOut}
              className="h-9 px-3 rounded-lg text-xs border border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Your houses</h1>
            <p className="text-sm text-slate-400 mt-1">Each house is a single domain workspace.</p>
          </div>
        </div>

        {/* ✅ Helpful hint when coming from Manage Domains */}
        {forceManage && (
          <div className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-[12px] text-cyan-200">
            Domain management mode (auto-skip disabled).
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-200">
            {error}
          </div>
        )}

        {houseList.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-6">
            <div className="text-sm font-semibold">No houses yet</div>
            <div className="text-sm text-slate-400 mt-1">Create your first house to start using the dashboard.</div>
            <button
              onClick={() => setCreateOpen(true)}
              className="mt-4 h-9 px-3 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 hover:from-cyan-300 hover:to-emerald-300"
            >
              Create a house
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {houseList.map((h) => {
              const isActive = h.id === activeHouseId;

              return (
                <div
                  key={h.id}
                  className={`rounded-2xl border bg-slate-950/70 p-4 transition ${
                    isActive
                      ? "border-emerald-400/50 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-slate-100">{h.name}</div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${domainBadgeClasses(h.domain)}`}>
                          {domainLabel(h.domain)}
                        </span>

                        {isActive && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full border border-emerald-400/40 text-emerald-200 bg-emerald-500/10">
                            Active
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteHouse(h.id)}
                      className="h-8 px-2 rounded-lg text-[11px] border border-rose-500/40 text-rose-200 bg-rose-500/10 hover:bg-rose-500/20"
                      title="Delete house"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="mt-3 text-[11px] text-slate-400">
                    Created: {new Date(h.createdAt).toLocaleString()}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => handleOpenHouse(h.id)}
                      className="h-9 flex-1 rounded-lg text-xs font-semibold bg-slate-900/70 border border-slate-700 text-slate-100 hover:bg-slate-900"
                    >
                      Open dashboard
                    </button>

                    <button
                      onClick={() => {
                        if (!userEmail) return;
                        localStorage.setItem(activeHouseKey(userEmail), h.id);
                        setActiveHouseId(h.id);
                      }}
                      className={`h-9 px-3 rounded-lg text-xs border ${
                        isActive
                          ? "border-emerald-400/50 text-emerald-200 bg-emerald-500/10"
                          : "border-slate-700 text-slate-200 bg-slate-900/60 hover:bg-slate-900"
                      }`}
                    >
                      Set active
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {createOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-5">
            <div className="text-sm font-semibold">Create a new house</div>
            <div className="text-xs text-slate-400 mt-1">Pick the single domain for this house.</div>

            <div className="mt-4 space-y-3">
              <div className="space-y-1">
                <div className="text-[11px] text-slate-400">House name</div>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Finance"
                  className="w-full h-9 rounded-lg bg-slate-900 border border-slate-700 px-3 text-xs text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-1">
                <div className="text-[11px] text-slate-400">Domain</div>
                <select
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full h-9 rounded-lg bg-slate-900 border border-slate-700 px-3 text-xs text-slate-100"
                >
                  {DOMAIN_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setCreateOpen(false);
                  setError(null);
                }}
                className="h-9 px-3 rounded-lg text-xs border border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateHouse}
                className="h-9 px-3 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 hover:from-cyan-300 hover:to-emerald-300"
              >
                Create & open
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}