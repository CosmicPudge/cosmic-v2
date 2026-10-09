"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { useDeveloperKioskData } from "@/hooks/os/useDeveloperKioskData";
import useWeather from "@/hooks/os/useWeather";
import WeatherIcon from "@/components/icons/weather/WeatherIcon";
import mapWeatherCondition from "@/components/icons/weather/mapWeatherCondition";

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
  const developer = useDeveloperKioskData();
  const directWeather = useWeather({ enabled: presentation === "kiosk" });
  const kioskWeather = developer.data?.weather ?? directWeather.weather;
  const kioskLocationLabel =
    developer.data?.location?.label ??
    (kioskWeather?.city && kioskWeather.city !== "Current location"
      ? kioskWeather.city
      : "Location unavailable");

  if (presentation === "kiosk") {
    return <KioskClockScene
      now={now}
      format={format}
      locationLabel={kioskLocationLabel}
      temperature={kioskWeather ? Math.round(kioskWeather.temp) : null}
      condition={kioskWeather?.condition ?? null}
      isDay={kioskWeather ? kioskWeather.daylightProgress > 0 && kioskWeather.daylightProgress < 100 : true}
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
  isDay,
}: {
  now: Date | number | null;
  format: Parameters<typeof formatClockTime>[1];
  locationLabel?: string;
  temperature: number | null;
  condition: string | null;
  isDay: boolean;
}) {
  const timeLabel = now === null ? "--:--" : formatClockTime(now, format);
  const timeParts = /^(.+?)(?:\s+(AM|PM))?$/.exec(timeLabel);
  const clockTime = timeParts?.[1] ?? timeLabel;
  const meridiem = timeParts?.[2] ?? "";
  const fullDate = now === null
    ? "Synchronizing"
    : new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(now);
  const resolvedLocation = locationLabel ?? "Location unavailable";
  const resolvedCondition = condition ?? "Weather unavailable";

  return (
    <section className="cosmos-kiosk-clock" aria-label="Cosmos clock">
      <Image
        className="cosmos-kiosk-clock-background"
        src="/kiosk/scenes/clock/clock-cosmic-night.png"
        alt=""
        fill
        priority
        sizes="100vw"
      />
      <div className="cosmos-kiosk-clock-shade" aria-hidden="true" />

      <header className="cosmos-kiosk-clock-brand">
        <strong>COSMOS</strong>
        <span aria-hidden="true">•</span>
        <span>CLOCK</span>
      </header>

      <div className="cosmos-kiosk-clock-center">
        <div className="cosmos-kiosk-clock-time-row">
          <p className="cosmos-kiosk-clock-time">{clockTime}</p>
          {meridiem ? <p className="cosmos-kiosk-clock-meridiem">{meridiem}</p> : null}
        </div>

        <p className="cosmos-kiosk-clock-date">{fullDate}</p>

        <div className="cosmos-kiosk-clock-status">
          <span className="cosmos-kiosk-clock-status-item">
            <MapPin size={22} strokeWidth={2.2} aria-hidden="true" />
            <span>{resolvedLocation}</span>
          </span>
          <span className="cosmos-kiosk-clock-status-divider" aria-hidden="true" />
          <span className="cosmos-kiosk-clock-status-item">
            {condition ? <WeatherIcon condition={mapWeatherCondition(condition)} isDay={isDay} size={26} /> : null}
            <span>{temperature !== null ? `${temperature}°F` : "--°F"}</span>
          </span>
          <span className="cosmos-kiosk-clock-status-divider" aria-hidden="true" />
          <span className="cosmos-kiosk-clock-status-item">
            <span>{resolvedCondition}</span>
          </span>
        </div>
      </div>
    </section>
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
