"use client";

import { useState } from "react";
import { AlarmClock, Clock3, Gauge, Globe2, Timer } from "lucide-react";

import { useClockTick } from "@/hooks/os/useClock";
import AlarmsPanel from "./AlarmsPanel";
import ClockOverview from "./ClockOverview";
import StopwatchPanel from "./StopwatchPanel";
import TimersPanel from "./TimersPanel";
import WorldClockPanel from "./WorldClockPanel";

type ClockTab = "clock" | "world" | "alarms" | "timers" | "stopwatch";

const tabs: Array<{ id: ClockTab; label: string; icon: React.ReactNode }> = [
  { id: "clock", label: "Clock", icon: <Clock3 size={17} /> },
  { id: "world", label: "World Clock", icon: <Globe2 size={17} /> },
  { id: "alarms", label: "Alarms", icon: <AlarmClock size={17} /> },
  { id: "timers", label: "Timers", icon: <Timer size={17} /> },
  { id: "stopwatch", label: "Stopwatch", icon: <Gauge size={17} /> },
];

export default function ClockView({ compact = false }: { compact?: boolean }) {
  const [activeTab, setActiveTab] = useState<ClockTab>("clock");
  const now = useClockTick(1_000);

  return (
    <div className={compact ? "space-y-6" : "space-y-8"}>
      <nav aria-label="Clock sections" className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max gap-2 rounded-2xl border border-white/9 bg-black/18 p-1.5 backdrop-blur-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-cyan-200 sm:px-4 ${activeTab === tab.id ? "bg-white text-slate-950 shadow" : "text-white/50 hover:bg-white/7 hover:text-white"}`}
            >
              {tab.icon}<span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {activeTab === "clock" && <ClockOverview now={now} />}
      {activeTab === "world" && <WorldClockPanel now={now} />}
      {activeTab === "alarms" && <AlarmsPanel now={now} />}
      {activeTab === "timers" && <TimersPanel now={now} />}
      {activeTab === "stopwatch" && <StopwatchPanel />}
    </div>
  );
}
