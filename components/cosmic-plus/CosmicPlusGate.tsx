"use client";

import Link from "next/link";
import type { CosmicFeature } from "@/core/contracts/Entitlements";
import { useEntitlements } from "@/hooks/os/useEntitlements";

export default function CosmicPlusGate({ feature, title, children }: { feature: CosmicFeature; title: string; children?: React.ReactNode }) {
  const { data, loading } = useEntitlements();
  if (loading || data.features[feature]) return children ?? null;
  return <section className="rounded-2xl border border-fuchsia-200/15 bg-fuchsia-200/[0.045] p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-100/65">Cosmic+</p><h3 className="mt-2 font-semibold text-white/85">{title}</h3><p className="mt-1 text-sm leading-6 text-white/48">This deeper Cosmic experience is available with Cosmic+. Your existing data remains preserved.</p><Link href="/cosmic-plus" className="mt-3 inline-flex rounded-xl border border-fuchsia-200/20 bg-fuchsia-200/10 px-3 py-2 text-sm text-fuchsia-50 hover:bg-fuchsia-200/15">Learn about Cosmic+</Link></section>;
}
