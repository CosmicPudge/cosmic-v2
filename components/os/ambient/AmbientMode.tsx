"use client";

import { useMemo } from "react";

import { useCosmicAccount } from "@/components/account/AccountProvider";
import CosmicIcon from "@/components/cosmic-icons/CosmicIcon";
import { useClockData } from "@/components/apps/clock/ClockProvider";
import { useSystem } from "@/components/os/system/SystemProvider";
import useCalendar from "@/hooks/os/useCalendar";
import useClock from "@/hooks/os/useClock";
import { useProjects } from "@/hooks/os/useProjects";
import { useSports } from "@/hooks/os/useSports";
import useWeather from "@/hooks/os/useWeather";
import mapWeatherCondition from "@/components/icons/weather/mapWeatherCondition";
import { getRelevantTimedEvent } from "@/services/calendar/relevance";
import { formatAmbientDate, formatClockTime, formatDuration, getTimerRemaining } from "@/services/clock/time";
import type { CosmicWeatherCondition } from "@/components/cosmic-icons/types";

function formatEventTime(date: Date) { return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); }
function firstName(displayName: string | undefined, email: string | undefined) { return displayName?.trim().split(/\s+/)[0] || email?.split("@")[0] || "there"; }
function greeting(hour: number) { if (hour < 5) return "Good night"; if (hour < 12) return "Good morning"; if (hour < 18) return "Good afternoon"; return "Good evening"; }
function cosmicWeatherCondition(condition: string, isDay: boolean): CosmicWeatherCondition {
  const mapped = mapWeatherCondition(condition);
  if (mapped === "clear") return isDay ? "clear-day" : "clear-night";
  if (mapped === "rain") return "rain";
  if (mapped === "thunderstorm") return "thunderstorm";
  if (mapped === "snow") return "snow";
  if (mapped === "fog") return "fog";
  if (mapped === "wind") return "wind";
  if (mapped === "partly-cloudy") return "partly-cloudy";
  return "cloudy";
}

function AmbientCard({ title, icon, children, className = "" }: { title: string; icon: "weather" | "calendar" | "sports" | "clock" | "tasks" | "system" | "cosmic-ai"; children: React.ReactNode; className?: string }) {
  const id = `ambient-${title.toLowerCase().replaceAll(" ", "-")}`;
  return <section className={`ambient-card ${className}`} aria-labelledby={id}><div className="ambient-card-heading"><CosmicIcon icon={icon} size={24} label="" /><h2 id={id}>{title}</h2></div>{children}</section>;
}

export default function AmbientMode() {
  const now = useClock();
  const clock = useClockData();
  const weather = useWeather();
  const calendar = useCalendar({ refreshMs: 60_000 });
  const sports = useSports({ refreshMs: (snapshot) => snapshot?.live.length ? 15_000 : 60_000 });
  const projects = useProjects();
  const { snapshot } = useSystem();
  const { account } = useCosmicAccount();
  const eventSelection = useMemo(() => now && calendar.calendar ? getRelevantTimedEvent([...calendar.calendar.today, ...calendar.calendar.upcoming], now) : { event: undefined, current: false }, [calendar.calendar, now]);
  const activeTimer = clock.data.timers.find((timer) => timer.status === "running") ?? clock.data.timers.find((timer) => timer.status === "paused");
  const reminders = projects.data.tasks.filter((task) => !task.completed).slice(0, 2);
  const liveSport = sports.data?.live[0];
  const sportEvent = liveSport ?? sports.data?.upcoming[0];
  const name = firstName(account?.displayName, account?.email);
  const online = snapshot.network.online;
  const status = !online ? "Working from cached data" : snapshot.power.reducedMotion ? "Quiet mode is active" : "All systems are ready";

  return <div className="ambient-mode" aria-label="Ambient Mode. Tap or press any key to wake Cosmic OS">
    <div className="ambient-topbar"><div className="ambient-wordmark" aria-label="Cosmic OS"><span className="ambient-orbit-mark" aria-hidden="true">◎</span><span>COSMIC OS</span></div><div className="ambient-top-meta"><span>{online ? "Connected" : "Offline"}</span><span className="ambient-status-dot" data-offline={!online} aria-hidden="true" /><span>Local time</span></div></div>
    <main className="ambient-layout">
      <section className="ambient-hero" aria-labelledby="ambient-time-title"><p className="ambient-eyebrow">Stay present · stay cosmic</p><h1 id="ambient-time-title" className="ambient-time" suppressHydrationWarning>{now ? formatClockTime(now, clock.data.preferences.hourFormat) : "--:--"}</h1><p className="ambient-date">{now ? formatAmbientDate(now) : "Synchronizing local time"}</p><p className="ambient-greeting">{greeting(now?.getHours() ?? 12)}, {name}.</p><p className="ambient-focus-line">One clear move at a time.</p></section>
      <aside className="ambient-rail" aria-label="Ambient live information">
        <AmbientCard title="Next up" icon="calendar">{calendar.loading && !calendar.calendar ? <p className="ambient-muted">Reading your calendar…</p> : calendar.error && !calendar.calendar ? <p className="ambient-muted">Calendar unavailable.</p> : eventSelection.event ? <div><p className="ambient-card-value">{eventSelection.event.title}</p><p className="ambient-card-detail">{eventSelection.current ? "Happening now" : formatEventTime(eventSelection.event.start)}{eventSelection.event.location ? ` · ${eventSelection.event.location}` : ""}</p></div> : <div><p className="ambient-card-value">The rest of today is open</p><p className="ambient-card-detail">No upcoming events.</p></div>}</AmbientCard>
        <AmbientCard title="Sports live" icon="sports">{sports.loading && !sports.data ? <p className="ambient-muted">Checking followed sports…</p> : sportEvent ? <div><div className="ambient-inline-status"><span className={`ambient-live-dot ${liveSport ? "is-live" : ""}`} />{liveSport ? "Live now" : "Up next"}</div><p className="ambient-card-value">{sportEvent.title}</p><p className="ambient-card-detail">{liveSport ? sportEvent.statusDetail ?? "Live score available" : formatEventTime(sportEvent.start)}</p></div> : <p className="ambient-muted">No followed games right now.</p>}</AmbientCard>
        <AmbientCard title="Focus timer" icon="clock"><div className="ambient-focus-card"><div><p className="ambient-timer">{activeTimer && now ? formatDuration(getTimerRemaining(activeTimer, now.getTime())) : "—"}</p><p className="ambient-card-detail">{activeTimer ? `${activeTimer.label} · ${activeTimer.status}` : "No active timer"}</p></div><span className={`ambient-ring ${activeTimer ? "is-active" : ""}`} aria-hidden="true" /></div></AmbientCard>
        <AmbientCard title="Cosmic status" icon="system"><div className="ambient-system-status"><span className="ambient-system-pulse" aria-hidden="true" /><div><p className="ambient-card-value">{status}</p><p className="ambient-card-detail">{online ? "Your workspace is aligned with the cosmos." : "Recent information remains available."}</p></div></div></AmbientCard>
      </aside>
      <div className="ambient-bottom-strip">
        <AmbientCard title="Weather" icon="weather">{weather.loading && !weather.weather ? <p className="ambient-muted">Locating conditions…</p> : weather.error || !weather.weather ? <p className="ambient-muted">Weather unavailable.</p> : <div className="ambient-weather"><CosmicIcon icon="weather" condition={cosmicWeatherCondition(weather.weather.condition, weather.weather.daylightProgress > 0 && weather.weather.daylightProgress < 100)} size={52} label="Current weather" glow="blue" /><div><p className="ambient-weather-temp">{Math.round(weather.weather.temp)}°</p><p className="ambient-card-detail">{weather.weather.condition} · {weather.weather.city}</p></div></div>}</AmbientCard>
        <AmbientCard title="Daily focus" icon="cosmic-ai"><p className="ambient-quote">“{activeTimer ? "Keep the next small promise." : "Small steps today make space for tomorrow."}”</p><p className="ambient-card-detail">A quiet intention for this moment.</p></AmbientCard>
        <AmbientCard title="Quick reminders" icon="tasks">{projects.loading ? <p className="ambient-muted">Checking reminders…</p> : reminders.length ? <ul className="ambient-reminder-list">{reminders.map((task) => <li key={task.id}><span className="ambient-check" aria-hidden="true" />{task.title}</li>)}</ul> : <p className="ambient-muted">No open reminders.</p>}</AmbientCard>
      </div>
    </main>
    <div className="ambient-wake-affordance"><span className="ambient-wake-orbit" aria-hidden="true">◎</span><span>Tap anywhere or press a key to wake</span></div>
  </div>;
}
