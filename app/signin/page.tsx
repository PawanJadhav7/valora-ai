"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { housesKey, activeHouseKey } from "@/app/lib/clientStorage";

export default function SignInPage() {
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  function routeAfterLogin(email: string) {
    try {
      const e = String(email || "").toLowerCase();
      const hk = housesKey(e);
      const ak = activeHouseKey(e);

      const housesRaw = localStorage.getItem(hk);
      const houses = housesRaw ? JSON.parse(housesRaw) : {};
      const ids = Object.keys(houses);

      if (ids.length === 1) {
        localStorage.setItem(ak, ids[0]);
        router.replace("/dashboard");
        return;
      }

      router.replace("/houses");
    } catch {
      router.replace("/houses");
    }
  }

  function handleSignIn() {
    setError(null);
    const e = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setError("Enter a valid email.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }

    try {
      // ✅ USERS
      const usersRaw = localStorage.getItem("valoraUsersV1");
      const users = usersRaw ? JSON.parse(usersRaw) : {};
      const u = users[e];

      if (!u) {
        setError("No account found. Please register.");
        return;
      }
      if (u.password !== password) {
        setError("Invalid password.");
        return;
      }

      // ✅ SESSION
      localStorage.setItem(
        "valoraSessionV1",
        JSON.stringify({
          email: e,
          signedInAt: new Date().toISOString(),
        })
      );

      // ✅ Route based on per-user houses
      routeAfterLogin(e);
    } catch {
      setError("Sign in failed. Try again.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950/90 p-5">
        <div className="text-lg font-semibold">Sign in</div>
        <div className="text-xs text-slate-400 mt-1">Continue to your workspace.</div>

        <div className="mt-4 space-y-3">
          <input
            className="w-full h-9 rounded-lg bg-slate-900 border border-slate-700 px-3 text-xs"
            placeholder="Work email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="w-full h-9 rounded-lg bg-slate-900 border border-slate-700 px-3 text-xs"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <div className="mt-3 text-[11px] text-rose-300">{error}</div>}

        <button
          onClick={handleSignIn}
          className="mt-4 w-full h-9 rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 text-xs font-semibold"
        >
          Sign in
        </button>

        <button
          onClick={() => router.push("/register")}
          className="mt-3 w-full h-9 rounded-lg border border-slate-700 bg-slate-900/60 text-xs text-slate-200"
        >
          Create a new account
        </button>
      </div>
    </div>
  );
}