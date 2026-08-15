"use client";

import { AlarmClock, Globe2, Timer } from "lucide-react";

import { useClockData } from "./ClockProvider";
import {
  formatClockDate,
  formatClockTime,
  formatDuration,
  formatNextOccurrence,
  getNextAlarmOccurrence,
  getTimerRemaining,
} from "@/services/clock/time";

export default function ClockOverview({ now }: { now: number | null }) {
  const clock = useClockData();
  const format = clock.data.preferences.hourFormat;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const nextAlarm = now === null
    ? null
    : clock.data.alarms
        .filter((alarm) => alarm.enabled)
        .map((alarm) => ({ alarm, occurrence: getNextAlarmOccurrence(alarm, now) }))
        .filter((entry): entry is { alarm: typeof entry.alarm; occurrence: Date } => entry.occurrence !== null)
        .sort((left, right) => left.occurrence.getTime() - right.occurrence.getTime())[0];
  const activeTimer = clock.data.timers.find((timer) => timer.status === "running")
    ?? clock.data.timers.find((timer) => timer.status === "paused")
    ?? clock.data.timers.find((timer) => timer.status === "complete");

  return (
    <section aria-labelledby="local-clock-title" className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,.8fr)]">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.055] p-6 shadow-2xl backdrop-blur-2xl sm:p-9 lg:p-12">
        <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-cyan-300/[0.08] blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.38em] text-cyan-100/50">Local time</p>
              <p className="mt-2 text-sm text-white/42">{timezone}</p>
            </div>
            <div className="inline-flex rounded-full border border-white/10 bg-black/20 p-1" aria-label="Hour format">
              {(["system", "12", "24"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => clock.setHourFormat(option)}
                  aria-pressed={format === option}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-cyan-200 ${format === option ? "bg-white text-slate-950" : "text-white/55 hover:text-white"}`}
                >
                  {option === "system" ? "System" : `${option}-hour`}
                </button>
              ))}
            </div>
          </div>
          <h2 id="local-clock-title" className="mt-12 whitespace-nowrap text-[clamp(2.5rem,8.5vw,8rem)] font-extralight leading-[0.82] tabular-nums tracking-[-0.07em]">
            {now === null ? "--:--:--" : formatClockTime(now, format, { seconds: true })}
          </h2>
          <p className="mt-9 text-[clamp(1.15rem,2.4vw,2rem)] font-light text-white/60">
            {now === null ? "Synchronizing date" : formatClockDate(now)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
        <SummaryCard
          icon={<AlarmClock size={19} />}
          label="Next alarm"
          value={nextAlarm ? nextAlarm.alarm.label || "Alarm" : "No alarms"}
          detail={nextAlarm ? formatNextOccurrence(nextAlarm.occurrence) : "Create one when you are ready"}
        />
        <SummaryCard
          icon={<Timer size={19} />}
          label="Active timer"
          value={activeTimer ? activeTimer.label : "No timer"}
          detail={activeTimer && now !== null ? `${formatDuration(getTimerRemaining(activeTimer, now))} · ${activeTimer.status}` : "Start a focused countdown"}
        />
        <SummaryCard
          icon={<Globe2 size={19} />}
          label="World clocks"
          value={`${clock.data.worldClocks.length} ${clock.data.worldClocks.length === 1 ? "location" : "locations"}`}
          detail={clock.data.worldClocks[0]?.timeZone ?? "Add the places that matter"}
        />
      </div>
    </section>
  );
}

function SummaryCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-cyan-100/55">{icon}<p className="text-[11px] font-semibold uppercase tracking-[0.26em]">{label}</p></div>
      <p className="mt-5 truncate text-xl font-medium text-white">{value}</p>
      <p className="mt-1 truncate text-sm capitalize text-white/45">{detail}</p>
    </div>
  );
}
