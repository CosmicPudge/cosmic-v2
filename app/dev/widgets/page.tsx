"use client";

import { dashboardWidgets } from "@/config/widgets";
import { WidgetProvider, WidgetLoading, WidgetEmpty, WidgetError } from "@/components/os/ui/widget";
import type { WidgetAccent, WidgetSize } from "@/components/os/ui/widget";

const sizes: WidgetSize[] = ["small", "medium", "large"];
const accents = new Set<WidgetAccent>(["default", "weather", "calendar", "sports", "garage", "school", "cosmic", "projects", "notifications", "notes", "outlook", "system", "music", "search", "briefing", "clock", "finance"]);
const accentFor = (id: string): WidgetAccent => accents.has(id as WidgetAccent) ? id as WidgetAccent : "default";

export default function WidgetGalleryPage() {
  return <main className="cosmic-site-shell min-h-screen overflow-x-hidden p-4 text-white sm:p-8"><div className="relative mx-auto max-w-[1800px]"><p className="cosmic-kicker">Cosmic OS / Development Preview</p><h1 className="mt-3 text-4xl font-light tracking-[.14em] sm:text-6xl">WIDGET GALLERY</h1><p className="mt-3 max-w-2xl text-sm text-white/55">Module-matched Dashboard previews. Real widget providers and empty/loading/degraded states are shown without changing production data behavior.</p><section className="mt-8 grid gap-4 lg:grid-cols-3"><StateCard state="loading"><WidgetLoading label="Module-shaped loading" compact /></StateCard><StateCard state="ready"><p className="text-sm text-emerald-100">Ready state preserves the module identity.</p></StateCard><StateCard state="degraded"><WidgetError title="Sync delayed" message="Reconnect required" compact /></StateCard></section><div className="mt-8 grid gap-6">{dashboardWidgets.map((widget) => { const WidgetComponent = widget.component; const accent = accentFor(widget.id); return <section key={widget.id} className="cosmic-content-surface rounded-3xl p-4 sm:p-5"><div className="mb-4 flex items-end justify-between"><div><p className="cosmic-kicker">{accent} module</p><h2 className="mt-1 text-xl text-white">{widget.id}</h2></div><span className="text-xs text-white/35">small · medium · large</span></div><div className="grid min-w-0 gap-4 xl:grid-cols-3">{sizes.map((size) => <div key={size} className="min-w-0"><p className="mb-2 text-[10px] uppercase tracking-[.2em] text-white/35">{size}</p><div className="h-[280px] min-w-0"><WidgetProvider size={size}><WidgetComponent /></WidgetProvider></div></div>)}</div></section>; })}</div></div></main>;
}

function StateCard({ state, children }: { state: "loading" | "ready" | "degraded"; children: React.ReactNode }) {
  return <div className={`cosmic-content-surface min-h-24 rounded-2xl border p-4 ${state === "degraded" ? "border-rose-300/25" : state === "ready" ? "border-emerald-300/25" : "border-violet-300/25"}`}><p className="cosmic-kicker">{state}</p><div className="mt-3 min-h-8">{children}</div></div>;
}

