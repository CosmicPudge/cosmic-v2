"use client";
import { useState } from "react";
import { getAdPlacement, getAdRuntimeConfig, type AdFormat, type AdPlacementId } from "@/core/contracts/Advertising";
import { useAdRuntime } from "./AdProvider";
import { useEntitlements } from "@/hooks/os/useEntitlements";

const formatClass: Record<AdFormat, string> = { banner: "min-h-[88px] sm:min-h-[120px]", "inline-card": "min-h-[110px]", sidebar: "min-h-[120px] lg:min-w-[180px]", compact: "min-h-[80px]" };
export default function AdSlot({ placementId, preview = false, fullRow = false }: { placementId: AdPlacementId; preview?: boolean; fullRow?: boolean }) {
  useEntitlements(); const runtime = useAdRuntime(); const placement = getAdPlacement(placementId); const config = getAdRuntimeConfig(); const [debug] = useState(() => typeof window !== "undefined" && process.env.NODE_ENV !== "production" && new URLSearchParams(window.location.search).has("adDebug"));
  if (!placement || !placement.enabled || placement.policy === "prohibited" || !runtime.eligible && !preview) return null;
  const placeholder = preview || runtime.mode === "placeholder" || process.env.NODE_ENV !== "production" && runtime.mode === "disabled";
  const providerReady = runtime.scriptReady && Boolean(config.slots[placementId]);
  if (!placeholder && (!runtime.eligible || runtime.mode === "disabled" || !providerReady)) return null;
  const adsWindow = typeof window === "undefined" ? undefined : window as Window & { adsbygoogle?: unknown[] };
  return <aside aria-label="Advertisement" data-ad-placement={placement.id} style={fullRow ? { gridColumn: "1 / -1" } : undefined} className={`my-5 block w-full overflow-hidden rounded-2xl border border-amber-100/15 bg-amber-100/[0.035] px-4 py-3 text-amber-50/60 ${formatClass[placement.format]} ${placement.breakpoint === "desktop" ? "hidden lg:block" : ""}`}>{debug ? <div className="mb-2 rounded border border-amber-100/10 bg-black/20 px-2 py-1 text-center font-mono text-[9px] text-white/55">{placement.id} · {placement.format} · {runtime.mode}</div> : null}{placeholder ? <div className="flex h-full min-h-[inherit] flex-col items-center justify-center gap-1 text-center"><p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-100/65">Advertisement</p><p className="text-xs">Development placeholder · Free plan layout</p><p className="text-[10px] text-white/35">Dedicated layout space</p></div> : <ins className="adsbygoogle block min-h-[inherit] w-full" style={{ display: "block" }} data-ad-client={`ca-${config.publisherId}`} data-ad-slot={config.slots[placementId]} data-ad-format="auto" data-full-width-responsive="true" {...(runtime.mode === "test" ? { "data-adtest": "on" } : {})} ref={(node) => { if (node && !node.dataset.cosmicInitialized) { node.dataset.cosmicInitialized = "true"; try { adsWindow?.adsbygoogle?.push({}); } catch { /* Provider failure must not affect Cosmic. */ } } }} />}</aside>;
}
