"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { housesKey, activeHouseKey } from "@/app/lib/clientStorage";

type House = {
  id: string;
  ownerEmail: string;
  name: string;
  domain: string;
  createdAt: string;
  status?: "Live" | "Coming soon";
};

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

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [domain, setDomain] = React.useState("E-commerce");

  function handleRegister() {
    setError(null);
    const e = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setError("Enter a valid email.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      // ✅ USERS (global OK)
      const usersRaw = localStorage.getItem("valoraUsersV1");
      const users = usersRaw ? JSON.parse(usersRaw) : {};

      if (users[e]) {
        setError("Account already exists. Please sign in.");
        return;
      }

      users[e] = {
        email: e,
        password, // demo only
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem("valoraUsersV1", JSON.stringify(users));

      // ✅ Normalize selected domain
      const domainNorm = domainLabel(domain.trim());

      // ✅ Create first house (per-user storage)
      const houseId = `house_${Date.now()}`;

      const firstHouse: House = {
        id: houseId,
        ownerEmail: e,
        name: `${domainNorm} House`,
        domain: domainNorm,
        createdAt: new Date().toISOString(),
        status: domainNorm === "E-commerce" ? "Live" : "Coming soon",
      };

      const hk = housesKey(e);
      const ak = activeHouseKey(e);

      // Save houses under per-user key
      localStorage.setItem(hk, JSON.stringify({ [houseId]: firstHouse }));

      // Set per-user active house
      localStorage.setItem(ak, houseId);

      // ✅ MUST set session before navigating (prevents dashboard redirect loop)
      localStorage.setItem(
        "valoraSessionV1",
        JSON.stringify({ email: e, signedInAt: new Date().toISOString() })
      );

      // Go directly to dashboard (auto-skip)
      router.replace("/dashboard");
    } catch {
      setError("Registration failed. Try again.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950/90 p-5">
        <div className="text-lg font-semibold">Create account</div>
        <div className="text-xs text-slate-400 mt-1">Start using Valora AI in minutes.</div>

        <div className="mt-4 space-y-3">
          <input
            className="w-full h-9 rounded-lg bg-slate-900 border border-slate-700 px-3 text-xs"
            placeholder="Work email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full h-9 rounded-lg bg-slate-900 border border-slate-700 px-2 text-xs text-slate-200"
          >
            <option value="E-commerce">E-commerce</option>
            <option value="SaaS">SaaS</option>
            <option value="Insurance">Insurance</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Supply Chain">Supply Chain</option>
            <option value="Finance">Finance</option>
          </select>

          <input
            className="w-full h-9 rounded-lg bg-slate-900 border border-slate-700 px-3 text-xs"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <div className="mt-3 text-[11px] text-rose-300">{error}</div>}

        <button
          onClick={handleRegister}
          className="mt-4 w-full h-9 rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 text-xs font-semibold"
        >
          Create account
        </button>

        <button
          onClick={() => router.push("/signin")}
          className="mt-3 w-full h-9 rounded-lg border border-slate-700 bg-slate-900/60 text-xs text-slate-200"
        >
          I already have an account
        </button>
      </div>
    </div>
  );
}