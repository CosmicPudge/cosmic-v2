"use client";
import { useEntitlements } from "@/hooks/os/useEntitlements";
import { adPlacements, getAdRuntimeConfig } from "@/core/contracts/Advertising";
import { useAdRuntime } from "./AdProvider";

export default function AdSystemDiagnostics() {
  const { data, loading } = useEntitlements(); const runtime = useAdRuntime(); const config = getAdRuntimeConfig();
  return <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><h2 className="font-semibold">Effective state</h2><dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4"><div><dt className="text-white/40">Effective plan</dt><dd className="mt-1">{loading ? "Loading…" : data.plan}</dd></div><div><dt className="text-white/40">Ad eligible</dt><dd className="mt-1">{loading ? "Loading…" : data.ads.adEligible ? "Yes" : "No"}</dd></div><div><dt className="text-white/40">Provider / mode</dt><dd className="mt-1">{config.provider} · {runtime.mode}</dd></div><div><dt className="text-white/40">Consent / script</dt><dd className="mt-1">{runtime.consentReady ? "ready" : "not detected"} · {runtime.scriptReady ? "loaded" : "not loaded"}</dd></div></dl><p className="mt-3 text-xs text-white/40">{runtime.reason} Provider slot IDs configured: {Object.keys(config.slots).length}/{adPlacements.length}. No private Cosmic data is sent as ad targeting.</p></section>;
}
