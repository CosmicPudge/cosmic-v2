"use client";

import Link from "next/link";
import { X } from "lucide-react";
import type { CosmicContextItem } from "@/core/contracts/Context";
import useCosmicContext from "@/hooks/os/useCosmicContext";
import GlassPanel from "@/components/os/ui/GlassPanel";

const priorityStyles = {
  critical: "border-rose-300/30 bg-rose-300/10",
  attention: "border-amber-200/25 bg-amber-200/10",
  glance: "border-sky-200/20 bg-sky-200/10",
  passive: "border-white/10 bg-white/5",
} as const;

function ContextRow({ item, onDismiss }: { item: CosmicContextItem; onDismiss: () => void }) {
  const content = <div className={`flex min-w-0 items-center gap-3 rounded-xl border px-3 py-2 ${priorityStyles[item.priority]}`}>
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-white">{item.title}</p>
      {item.subtitle && <p className="truncate text-xs text-white/55">{item.subtitle}</p>}
    </div>
    <button type="button" aria-label={`Dismiss ${item.title}`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); onDismiss(); }} className="rounded-md p-1 text-white/40 hover:bg-white/10 hover:text-white"><X size={14} /></button>
  </div>;
  return item.destination ? <Link href={item.destination} className="block min-w-0">{content}</Link> : content;
}

export default function ContextFocus() {
  const context = useCosmicContext();
  const rows = [context.primary, ...context.secondary].filter((item): item is CosmicContextItem => Boolean(item));
  return <GlassPanel className="w-full" style={{ minHeight: 96 }}>
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-2 pt-4 sm:px-5">
      <div><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">Cosmic context</p><p className="mt-1 text-sm text-white/70">Now / Focus</p></div>
      {context.loading && <span className="text-xs text-white/35">Updating…</span>}
    </div>
    <div className="grid gap-2 px-4 pb-4 sm:grid-cols-2 sm:px-5 lg:grid-cols-4">
      {rows.length ? rows.map((item) => <ContextRow key={item.id} item={item} onDismiss={() => context.dismiss(item)} />) : <p className="col-span-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/50">Nothing needs your attention right now.</p>}
    </div>
  </GlassPanel>;
}
