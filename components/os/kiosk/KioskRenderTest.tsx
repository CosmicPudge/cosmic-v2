"use client";

import ClockWidget from "@/components/os/widgets/clock/ClockWidget";
import MusicWidget from "@/components/os/widgets/music/MusicWidget";
import WeatherWidget from "@/components/os/widgets/weather/WeatherWidget";
import { DashboardReadinessProvider } from "@/components/dashboard/readiness/DashboardReadiness";
import { WidgetProvider } from "@/components/os/ui/widget/WidgetContext";
import { useSports } from "@/hooks/os/useSports";
import { selectKioskLiveEvent } from "./kioskSports";
import KioskSportsOverride from "./KioskSportsOverride";

export type KioskRenderTestMode = "static" | "clock" | "music" | "weather" | "sports";

export function parseKioskRenderTestMode(value: string | null): KioskRenderTestMode | null {
  return value === "static" || value === "clock" || value === "music" || value === "weather" || value === "sports" ? value : null;
}

export default function KioskRenderTest({ mode }: { mode: KioskRenderTestMode }) {
  if (mode === "static") return <StaticRenderTest />;

  return (
    <DashboardReadinessProvider criticalWidgetIds={[]}>
      <div className="fixed inset-0 min-h-0 min-w-0 overflow-hidden" data-kiosk-render-test={mode}>
        <RenderTestBadge mode={mode} />
        {mode === "sports" ? <SportsRenderTest /> : <WidgetProvider size="large" presentation="kiosk" active><TestWidget mode={mode} /></WidgetProvider>}
      </div>
    </DashboardReadinessProvider>
  );
}

function StaticRenderTest() {
  return (
    <div className="fixed inset-0 grid place-items-center overflow-hidden bg-[#030511] px-6 text-center text-white">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.34em] text-cyan-100/60">Cosmic Display</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">RENDER TEST: STATIC</h1>
        <p className="mt-3 text-xs uppercase tracking-[.2em] text-white/40">Basic shell and React only</p>
      </div>
      <RenderTestBadge mode="static" />
    </div>
  );
}

function RenderTestBadge({ mode }: { mode: KioskRenderTestMode }) {
  return <span className="pointer-events-none fixed right-3 top-3 z-50 rounded-full border border-cyan-100/20 bg-[#030511]/80 px-2 py-1 text-[9px] font-semibold uppercase tracking-[.18em] text-cyan-100/60">Render test · {mode}</span>;
}

function TestWidget({ mode }: { mode: Exclude<KioskRenderTestMode, "static" | "sports"> }) {
  if (mode === "clock") return <ClockWidget />;
  if (mode === "music") return <MusicWidget />;
  return <WeatherWidget />;
}

function SportsRenderTest() {
  const { data } = useSports({ refreshMs: 15_000 });
  const event = selectKioskLiveEvent(data?.live ?? []);

  if (!event) return <div className="grid h-full place-items-center px-6 text-center text-sm text-white/55">No live sports signal</div>;
  return <KioskSportsOverride event={event} />;
}
