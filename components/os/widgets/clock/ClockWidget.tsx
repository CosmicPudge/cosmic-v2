"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CosmicIcon } from "@/components/cosmic-icons";

import { useClockData } from "@/components/apps/clock/ClockProvider";
import { useClockTick } from "@/hooks/os/useClock";
import {
  formatAmbientDate,
  formatClockTime,
  formatDuration,
  formatNextOccurrence,
  getNextAlarmOccurrence,
  getTimerRemaining,
} from "@/services/clock/time";
import {
  useWidgetContext,
  Widget,
  WidgetBody,
  WidgetHeader,
} from "@/components/os/ui/widget";
import { currentClockImage } from "@/components/dashboard/images/dashboardImageManifest";

export default function ClockWidget() {
  const { size, presentation } = useWidgetContext();
  const clock = useClockData();
  const now = useClockTick(1_000);
  const format = clock.data.preferences.hourFormat;
  const activeTimer = clock.data.timers.find((timer) => timer.status === "running")
    ?? clock.data.timers.find((timer) => timer.status === "paused")
    ?? clock.data.timers.find((timer) => timer.status === "complete");
  const nextAlarm = now === null
    ? null
    : clock.data.alarms
        .filter((alarm) => alarm.enabled)
        .map((alarm) => ({ alarm, occurrence: getNextAlarmOccurrence(alarm, now) }))
        .filter((entry) => entry.occurrence !== null)
        .sort((left, right) => left.occurrence!.getTime() - right.occurrence!.getTime())[0];
  const clockImage = currentClockImage();

  if (presentation === "kiosk") {
    return <KioskClockScene now={now} format={format} nextAlarm={nextAlarm?.occurrence ?? null} />;
  }

  return (
    <Widget
      accent="clock"
      imageUrl={clockImage.src}
      imagePosition={clockImage.objectPosition}
      imageOpacity={.78}
      imageBlur={0}
    >
      <WidgetHeader
        title="Clock"
        subtitle={size === "small" ? undefined : "Local time"}
        action={
          <Link href="/clock" aria-label="Open Clock" className="rounded-xl p-2 text-white/45 transition hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-200">
            <ArrowUpRight size={17} />
          </Link>
        }
      />
      <WidgetBody className={size === "small" ? "gap-2" : "gap-4"}>
        <div>
          <p className={`font-extralight tabular-nums tracking-[-0.055em] text-white ${size === "small" ? "text-4xl" : "text-5xl"}`}>
            {now === null ? "--:--" : formatClockTime(now, format)}
          </p>
          <p className="mt-1 text-sm text-white/45">{now === null ? "Synchronizing" : formatAmbientDate(now)}</p>
        </div>

        {size !== "small" && (
          <div className={`grid gap-2 ${size === "large" ? "sm:grid-cols-2" : ""}`}>
            <StatusRow
              label={activeTimer ? "Timer" : "Next alarm"}
              value={activeTimer && now !== null
                ? `${formatDuration(getTimerRemaining(activeTimer, now))} remaining`
                : nextAlarm?.occurrence
                  ? formatNextOccurrence(nextAlarm.occurrence)
                  : "Nothing scheduled"}
              state={activeTimer?.status ?? nextAlarm?.alarm.label}
            />
            {size === "large" && activeTimer && (
              <StatusRow label="Next alarm" value={nextAlarm?.occurrence ? formatNextOccurrence(nextAlarm.occurrence) : "Nothing scheduled"} state={nextAlarm?.alarm.label} />
            )}
          </div>
        )}

        {size === "large" && clock.data.worldClocks.length > 0 && now !== null && (
          <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-white/8 pt-3 text-xs">
            {clock.data.worldClocks.slice(0, 3).map((location) => (
              <span key={location.id} className="text-white/42"><strong className="font-medium text-white/65">{location.label}</strong> {formatClockTime(now, format, { timeZone: location.timeZone })}</span>
            ))}
          </div>
        )}
      </WidgetBody>
    </Widget>
  );
}

function KioskClockScene({ now, format, nextAlarm }: { now: Date | number | null; format: Parameters<typeof formatClockTime>[1]; nextAlarm: Date | number | null }) {
  return (
    <Widget
      accent="clock"
      className="kiosk-clock-widget"
      contentPadding={false}
      sceneVariant="night"
      imageUrl="/kiosk/scenes/clock/clock-cosmic-night.png"
      imagePosition="center center"
      imageOpacity={1}
      imageBlur={0}
    >
      <div className="kiosk-clock-scene relative flex h-full min-h-0 flex-col items-center justify-center overflow-hidden px-5 pb-16 pt-8 text-center text-white sm:px-10">
        <div className="absolute left-5 top-5 flex items-center gap-2 text-white/80 sm:left-8 sm:top-8">
          <CosmicIcon icon="clock" size={22} glow="purple" label="" />
          <span className="text-[clamp(.65rem,1.25vw,.95rem)] font-medium tracking-[.18em]">COSMIC OS</span>
        </div>

        <div className="relative z-10 flex max-w-full flex-col items-center">
          <p className="kiosk-clock-scene-time tabular-nums font-extralight tracking-[-0.08em] text-white">
            {now === null ? "--:--" : formatClockTime(now, format)}
          </p>
          <p className="mt-3 text-[clamp(.8rem,1.8vw,1.35rem)] font-medium uppercase tracking-[.34em] text-white/85">
            {now === null ? "Synchronizing" : new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(now)}
          </p>
          <p className="mt-1 text-[clamp(.75rem,1.5vw,1.1rem)] uppercase tracking-[.24em] text-white/65">
            {now === null ? "" : new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" }).format(now)}
          </p>
        </div>

        {nextAlarm && (
          <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-center text-white/75">
            <p className="text-[.58rem] font-semibold uppercase tracking-[.28em] text-cyan-100/70">Next alarm</p>
            <p className="mt-1 text-[clamp(.75rem,1.2vw,1rem)] tabular-nums">{formatClockTime(nextAlarm, format)}</p>
          </div>
        )}
      </div>
    </Widget>
  );
}

function StatusRow({ label, value, state }: { label: string; value: string; state?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/8 bg-black/15 px-3 py-2">
      <div className="flex items-center justify-between gap-2"><span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-100/45">{label}</span>{state && <span className="truncate text-[10px] capitalize text-white/32">{state}</span>}</div>
      <p className="mt-1 truncate text-sm text-white/70">{value}</p>
    </div>
  );
}
