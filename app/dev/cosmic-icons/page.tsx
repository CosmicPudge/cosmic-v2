"use client";

import { useState } from "react";

import { CosmicIcon, iconLabels } from "@/components/cosmic-icons";
import type { CosmicFinanceTrend, CosmicIconName, CosmicIconState, CosmicWeatherCondition } from "@/components/cosmic-icons";

const iconNames = Object.keys(iconLabels) as CosmicIconName[];
const states: CosmicIconState[] = ["idle", "hover", "active", "loading", "success", "warning", "error", "live", "attention", "disabled"];
const conditions: CosmicWeatherCondition[] = ["clear-day", "clear-night", "partly-cloudy", "cloudy", "rain", "heavy-rain", "thunderstorm", "snow", "fog", "wind", "sunrise", "sunset"];
const sizes = [16, 20, 24, 32, 48, 64, 96];

export default function CosmicIconsPage() {
  const [state, setState] = useState<CosmicIconState>("idle");
  const [condition, setCondition] = useState<CosmicWeatherCondition>("rain");
  const [count, setCount] = useState(3);
  const [trend, setTrend] = useState<CosmicFinanceTrend>("up");
  const [live, setLive] = useState(true);
  const [playing, setPlaying] = useState(true);

  return (
    <main className="cosmic-site-shell min-h-screen overflow-x-hidden p-5 text-white sm:p-8">
      <div className="cosmic-stars pointer-events-none fixed inset-0" />
      <div className="relative mx-auto max-w-7xl">
        <header className="mb-8 border-b border-violet-300/20 pb-6">
          <p className="cosmic-kicker">Cosmic OS / Development Preview</p>
          <h1 className="mt-3 text-4xl font-light tracking-[.18em] text-white sm:text-6xl">ANIMATED ICONS</h1>
          <p className="mt-3 max-w-2xl text-sm text-violet-100/65">Reusable, data-aware icon primitives with visibility-aware motion and reduced-motion support.</p>
        </header>

        <section className="cosmic-content-surface mb-8 grid gap-4 rounded-3xl p-5 md:grid-cols-2 xl:grid-cols-5" aria-label="Icon controls">
          <label className="text-xs uppercase tracking-[.16em] text-violet-100/60">State<select value={state} onChange={(e) => setState(e.target.value as CosmicIconState)} className="mt-2 w-full rounded-xl border border-violet-300/20 bg-black/30 px-3 py-2 text-sm text-white">{states.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="text-xs uppercase tracking-[.16em] text-violet-100/60">Weather<select value={condition} onChange={(e) => setCondition(e.target.value as CosmicWeatherCondition)} className="mt-2 w-full rounded-xl border border-violet-300/20 bg-black/30 px-3 py-2 text-sm text-white">{conditions.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="text-xs uppercase tracking-[.16em] text-violet-100/60">Notifications<input type="number" min={0} max={999} value={count} onChange={(e) => setCount(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-violet-300/20 bg-black/30 px-3 py-2 text-sm text-white" /></label>
          <label className="text-xs uppercase tracking-[.16em] text-violet-100/60">Finance<select value={trend} onChange={(e) => setTrend(e.target.value as CosmicFinanceTrend)} className="mt-2 w-full rounded-xl border border-violet-300/20 bg-black/30 px-3 py-2 text-sm text-white"><option>up</option><option>down</option><option>neutral</option></select></label>
          <div className="flex flex-wrap items-end gap-2"><button type="button" onClick={() => setLive((value) => !value)} className={`rounded-xl border px-3 py-2 text-xs ${live ? "border-rose-300/50 bg-rose-400/20 text-rose-100" : "border-white/15 text-white/60"}`}>Sports live: {String(live)}</button><button type="button" onClick={() => setPlaying((value) => !value)} className={`rounded-xl border px-3 py-2 text-xs ${playing ? "border-cyan-300/50 bg-cyan-400/20 text-cyan-100" : "border-white/15 text-white/60"}`}>Music: {playing ? "playing" : "paused"}</button></div>
        </section>

        <section className="cosmic-content-surface rounded-3xl p-5" aria-labelledby="icon-registry-heading">
          <div className="mb-5 flex items-end justify-between gap-4"><div><p className="cosmic-kicker">Central registry</p><h2 id="icon-registry-heading" className="mt-1 text-xl text-white">Every Cosmic icon · 16 → 96 px</h2></div><CosmicIcon icon="cosmic-ai" size={48} state="active" label="Cosmic AI preview" /></div>
          <div className="grid gap-2">
            {iconNames.map((icon) => (
              <div key={icon} className="grid min-h-24 grid-cols-[minmax(110px,1fr)_repeat(7,minmax(34px,1fr))] items-center gap-2 rounded-2xl border border-white/[.07] bg-black/20 px-3 py-3">
                <div className="min-w-0"><p className="truncate text-xs font-medium text-white/90">{iconLabels[icon]}</p><code className="text-[10px] text-violet-200/45">{icon}</code></div>
                {sizes.map((size) => <CosmicIcon key={`${icon}-${size}`} icon={icon} size={size} state={state} condition={icon === "weather" ? condition : undefined} count={icon === "notifications" ? count : undefined} trend={icon === "finance" ? trend : undefined} live={icon === "sports" ? live : false} playing={icon === "music" ? playing : false} label={`${iconLabels[icon]} ${size}px`} />)}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
