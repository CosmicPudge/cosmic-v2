"use client";

import Link from "next/link";
import { X } from "lucide-react";
import type { CosmicContextItem } from "@/core/contracts/Context";
import useCosmicContext from "@/hooks/os/useCosmicContext";
import GlassPanel from "@/components/os/ui/GlassPanel";
import { useDashboardWidgetReadiness } from "@/components/dashboard/readiness/DashboardReadiness";
import { rankDashboardContext, type DashboardContextCandidate } from "@/services/dashboard/contextPriority";
import { useSettingsRepository } from "@/services/settings/localRepository";

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

function contextTime(item: CosmicContextItem) {
  const value = item.startsAt ?? item.timestamp;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function NextUpRow({ candidate, onDismiss }: { candidate: DashboardContextCandidate; onDismiss: () => void }) {
  const { item } = candidate;
  const content = <div className="group flex min-w-0 items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] px-3 py-2.5 transition-colors hover:border-white/16 hover:bg-white/[0.05]">
    <span className="w-12 shrink-0 font-mono text-[11px] tabular-nums text-cyan-100/60">{contextTime(item)}</span>
    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-200/65 shadow-[0_0_10px_rgba(103,232,249,.45)]" aria-hidden="true" />
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-medium text-white/85">{item.title}</span>
      {item.subtitle && <span className="block truncate text-xs text-white/45">{item.subtitle}</span>}
    </span>
    <button type="button" aria-label={`Dismiss ${item.title}`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); onDismiss(); }} className="rounded-md p-1 text-white/35 opacity-0 transition-opacity hover:bg-white/10 hover:text-white focus-visible:opacity-100 group-hover:opacity-100 focus-visible:outline-2 focus-visible:outline-cyan-200"><X size={14} /></button>
  </div>;
  return item.destination ? <Link href={item.destination} className="block min-w-0">{content}</Link> : content;
}

function ContextCandidate({ candidate, onDismiss }: { candidate: DashboardContextCandidate; onDismiss: () => void }) {
  return <ContextRow item={candidate.item} onDismiss={onDismiss} />;
}

export default function ContextFocus() {
  const context = useCosmicContext();
  const { data: settings } = useSettingsRepository();
  useDashboardWidgetReadiness("context", context.loading ? "loading" : "ready");
  const plan = rankDashboardContext(context.items, { widgetOrder: settings.preferences.dashboard.widgetOrder });
  return <GlassPanel className="dashboard-context-card w-full" style={{ minHeight: 96 }}>
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-2 pt-4 sm:px-5">
      <div><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">Cosmic context</p><p className="mt-1 text-sm text-white/70">{plan.daypart === "late-night" ? "Tomorrow / Focus" : "Now / Focus"}</p></div>
      {context.loading && <span className="text-xs text-white/35">Updating…</span>}
    </div>
    <div className="space-y-3 px-4 pb-4 sm:px-5">
      {plan.primary ? <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-200/65">Primary context</p><ContextCandidate candidate={plan.primary} onDismiss={() => context.dismiss(plan.primary!.item)} /></div> : <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/50">Nothing needs your attention right now.</p>}
      {plan.nextUp.length ? <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Next up</p><div className="grid gap-2 sm:grid-cols-2">{plan.nextUp.map((candidate) => <NextUpRow key={candidate.item.id} candidate={candidate} onDismiss={() => context.dismiss(candidate.item)} />)}</div></div> : null}
      {plan.atAGlance.length ? <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">At a glance</p><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{plan.atAGlance.map((candidate) => <ContextCandidate key={candidate.item.id} candidate={candidate} onDismiss={() => context.dismiss(candidate.item)} />)}</div></div> : null}
    </div>
  </GlassPanel>;
}
