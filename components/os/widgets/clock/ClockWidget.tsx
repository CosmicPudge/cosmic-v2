"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CosmicIcon } from "@/components/cosmic-icons";
import { useDeveloperKioskData } from "@/hooks/os/useDeveloperKioskData";
import KioskSceneIdentity from "@/components/os/widgets/shared/KioskSceneIdentity";

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
  const developer = useDeveloperKioskData({ poll: false });

  if (presentation === "kiosk") {
    return <KioskClockScene
      now={now}
      format={format}
      locationLabel={developer.data?.location?.label}
      temperature={developer.data?.weather ? Math.round(developer.data.weather.temp) : null}
      condition={developer.data?.weather?.condition ?? null}
    />;
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

function KioskClockScene({
  now,
  format,
  locationLabel,
  temperature,
  condition,
}: {
  now: Date | number | null;
  format: Parameters<typeof formatClockTime>[1];
  locationLabel?: string;
  temperature: number | null;
  condition: string | null;
}) {
  const timeLabel = now === null ? "--:--" : formatClockTime(now, format);
  const timeParts = /^(.+?)(?:\s+(AM|PM))?$/.exec(timeLabel);
  const clockTime = timeParts?.[1] ?? timeLabel;
  const meridiem = timeParts?.[2] ?? "";
  const fullDate = now === null
    ? "Synchronizing"
    : new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(now);

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
      <div className="kiosk-clock-scene relative flex h-full min-h-0 flex-col overflow-hidden text-center text-white">
        <KioskSceneIdentity sceneLabel="CLOCK" />

        <div className="kiosk-clock-reference-content relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center">
          <div className="kiosk-clock-reference-time-row flex items-end justify-center">
            <p className="kiosk-clock-reference-time tabular-nums font-semibold tracking-[-0.075em] text-white">
              {clockTime}
            </p>
            {meridiem ? <p className="kiosk-clock-reference-meridiem">{meridiem}</p> : null}
          </div>

          <p className="kiosk-clock-reference-date">{fullDate}</p>

          {(locationLabel || temperature !== null || condition) && (
            <div className="kiosk-clock-reference-status">
              {locationLabel ? (
                <span className="kiosk-clock-reference-status-item">
                  <span aria-hidden="true">●</span>
                  {locationLabel}
                </span>
              ) : null}
              {temperature !== null ? (
                <span className="kiosk-clock-reference-status-item">
                  <span className="kiosk-clock-reference-weather-icon" aria-hidden="true">☀</span>
                  {temperature}°F
                </span>
              ) : null}
              {condition ? <span className="kiosk-clock-reference-status-item">{condition}</span> : null}
            </div>
          )}
        </div>

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
