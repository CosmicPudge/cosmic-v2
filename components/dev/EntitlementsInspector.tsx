"use client";

import { useEffect, useState } from "react";
import { useCosmicAccount } from "@/components/account/AccountProvider";
import DevPlanSwitcher from "@/components/dev/DevPlanSwitcher";
import { useCosmicScope } from "@/services/storage/scope";
import type { CosmicEntitlements, CosmicPlan } from "@/core/contracts/Entitlements";

interface EntitlementDiagnostics {
  account: string;
  billingPlan: CosmicPlan;
  developmentOverride: CosmicPlan | null;
  effectivePlan: CosmicPlan;
  entitlements: CosmicEntitlements;
}

export default function EntitlementsInspector() {
  const [mounted, setMounted] = useState(false);
  const { account, loading: accountLoading } = useCosmicAccount();
  const scope = useCosmicScope();
  const [data, setData] = useState<EntitlementDiagnostics>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const accountId = account?.id;

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function load() {
    const response = await fetch("/api/dev/entitlements", { cache: "no-store" });
    const payload = await response.json() as EntitlementDiagnostics & { error?: string };
    if (!response.ok) {
      setError(payload.error ?? "Entitlements unavailable.");
      return;
    }
    setData(payload);
    setError(undefined);
  }

  useEffect(() => {
    if (!mounted || accountLoading) return;
    const timer = window.setTimeout(() => { if (accountId) void load(); else setData(undefined); }, 0);
    return () => window.clearTimeout(timer);
  }, [accountId, accountLoading, mounted]);

  async function setPlan(plan: CosmicPlan) {
    if (!account || accountLoading) return;
    setBusy(true);
    try {
      const response = await fetch("/api/dev/entitlements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
      const payload = await response.json() as EntitlementDiagnostics & { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not change entitlement.");
        return;
      }
      setData(payload);
      window.dispatchEvent(new Event("cosmic:entitlements-updated"));
    } finally {
      setBusy(false);
    }
  }

  async function resetOverride() {
    if (!account || accountLoading) return;
    setBusy(true);
    try {
      const response = await fetch("/api/dev/entitlements", { method: "DELETE" });
      const payload = await response.json() as EntitlementDiagnostics & { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not reset entitlement override.");
        return;
      }
      setData(payload);
      window.dispatchEvent(new Event("cosmic:entitlements-updated"));
    } finally {
      setBusy(false);
    }
  }

  if (!mounted) return <main className="mx-auto max-w-3xl space-y-6 p-6 text-white"><p className="text-xs uppercase tracking-[0.2em] text-fuchsia-100/60">Developer tools</p><h1 className="mt-2 text-3xl font-semibold">Entitlement Inspector</h1><p className="mt-2 text-sm text-white/50">Reading entitlement state…</p></main>;

  const accountReady = Boolean(account) && !accountLoading;
  const entitlements = data?.entitlements;
  return <main className="mx-auto max-w-3xl space-y-6 p-6 text-white"><div><p className="text-xs uppercase tracking-[0.2em] text-fuchsia-100/60">Developer tools</p><h1 className="mt-2 text-3xl font-semibold">Entitlement Inspector</h1><p className="mt-2 text-sm text-white/50">Development-only account plan simulation. It is disabled in production.</p></div>{error ? <p role="alert" className="rounded-xl border border-rose-200/15 bg-rose-200/[0.06] p-3 text-sm text-rose-100">{error}</p> : null}<DevPlanSwitcher accountReady={accountReady} effectivePlan={data?.effectivePlan} override={data?.developmentOverride} busy={busy} onSetPlan={(plan) => void setPlan(plan)} onReset={() => void resetOverride()} /><section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-white/40">Account</dt><dd className="mt-1 break-all">{account?.id ?? "Guest"}</dd></div><div><dt className="text-white/40">Scope</dt><dd className="mt-1">{scope.id} · {scope.kind}</dd></div><div><dt className="text-white/40">Billing plan</dt><dd className="mt-1 text-xl font-semibold">{data?.billingPlan ?? "Loading…"}</dd></div><div><dt className="text-white/40">Development override</dt><dd className="mt-1">{data?.developmentOverride ?? "None"}</dd></div><div><dt className="text-white/40">Effective plan</dt><dd className="mt-1 text-xl font-semibold">{data?.effectivePlan ?? "Loading…"}</dd></div><div><dt className="text-white/40">Entitlement source</dt><dd className="mt-1">{entitlements?.source ?? "—"}</dd></div><div><dt className="text-white/40">Ad eligible</dt><dd className="mt-1">{entitlements ? (entitlements.ads.adEligible ? "Yes" : "No · Cosmic+ is ad-free") : "—"}</dd></div><div><dt className="text-white/40">Garage active vehicle limit</dt><dd className="mt-1">{entitlements ? (entitlements.limits["garage.activeVehicles"] ?? "Unlimited") : "—"}</dd></div></dl></section>{entitlements ? <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><h2 className="font-semibold">Resolved capabilities</h2><ul className="mt-3 grid gap-2 text-sm text-white/65 sm:grid-cols-2">{Object.entries(entitlements.features).map(([feature, enabled]) => <li key={feature} className={enabled ? "text-emerald-200/80" : "text-white/35"}>{enabled ? "✓" : "—"} {feature}</li>)}</ul></section> : null}</main>;
}
