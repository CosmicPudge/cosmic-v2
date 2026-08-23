"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { useCosmicAccount } from "./AccountProvider";
import ConnectionsPanel from "./ConnectionsPanel";
import { useEntitlements } from "@/hooks/os/useEntitlements";

const inputClass = "mt-2 w-full rounded-xl border border-white/12 bg-white/[0.06] px-3 py-3 text-sm text-white outline-none focus:border-cyan-200/40 focus:ring-4 focus:ring-cyan-300/10";
const buttonClass = "rounded-xl border border-cyan-200/20 bg-cyan-200/10 px-4 py-3 text-sm font-semibold text-cyan-50 hover:bg-cyan-200/15 disabled:opacity-40";

export default function AccountView() {
  const { loading, account, expiresAt, refresh, signOut } = useCosmicAccount();
  const { data: entitlements } = useEntitlements();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(null);
    try {
      const response = await fetch(`/api/account/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, displayName }) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Account request failed.");
      await refresh(); setPassword("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Account request failed."); } finally { setBusy(false); }
  }

  if (loading) return <main className="mx-auto max-w-xl p-6 text-sm text-white/55">Checking Cosmic account session…</main>;
  if (account) return <main className="mx-auto max-w-xl p-6"><p className="text-xs uppercase tracking-[0.2em] text-cyan-100/50">Cosmic account</p><h1 className="mt-2 text-4xl font-black">{account.displayName ?? account.email}</h1><p className="mt-2 text-white/50">{account.email}</p><div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/60"><div className="flex items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-white/35">Plan</p><p className="mt-1 text-xl font-semibold text-white/85">{entitlements.plan === "cosmic_plus" ? "Cosmic+" : "Free"}</p></div><Link href="/cosmic-plus" className="rounded-xl border border-fuchsia-200/20 bg-fuchsia-200/10 px-3 py-2 text-sm text-fuchsia-50">View Cosmic+</Link></div><p className="mt-4">Private browser data is now isolated to this account.</p><p className="mt-2 text-xs text-white/35">Session expires {expiresAt ? new Date(expiresAt).toLocaleString() : "later"}.</p></div><ConnectionsPanel /><div className="mt-5 flex gap-3"><button type="button" className={buttonClass} onClick={() => void signOut()}>Sign out</button><Link className="rounded-xl border border-white/12 px-4 py-3 text-sm text-white/70" href="/settings">Settings</Link></div></main>;
  return <main className="mx-auto max-w-xl p-6"><p className="text-xs uppercase tracking-[0.2em] text-cyan-100/50">Cosmic account</p><h1 className="mt-2 text-4xl font-black">{mode === "signin" ? "Sign in" : "Create your account"}</h1><p className="mt-2 text-sm leading-6 text-white/45">Guest mode remains available. An account keeps your private Cosmic data in its own browser scope.</p><form onSubmit={submit} className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">{mode === "signup" ? <label className="block text-sm text-white/65">Display name<input className={inputClass} value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="name" /></label> : null}<label className="block text-sm text-white/65">Email<input required type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label><label className="block text-sm text-white/65">Password<input required type="password" minLength={10} className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signin" ? "current-password" : "new-password"} /></label>{error ? <p role="alert" className="text-sm text-rose-200">{error}</p> : null}<button disabled={busy} className={buttonClass}>{busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}</button></form><button type="button" className="mt-4 text-sm text-cyan-100/70" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }}>{mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}</button></main>;
}
