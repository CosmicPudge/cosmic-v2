"use client";

import type { CalendarEvent, CalendarSnapshot } from "@/core/contracts";
import { useClockTick } from "@/hooks/os/useClock";
import { Widget } from "@/components/os/ui/widget";
import KioskSceneIdentity from "../shared/KioskSceneIdentity";
import { compactKioskLocation } from "@/services/kiosk/presentation";
import KioskConnectionStatus from "../shared/KioskConnectionStatus";

interface Props { calendar: CalendarSnapshot | null; loading: boolean; error: string | null }

export default function KioskCalendarScene({ calendar, loading, error }: Props) {
  const tick = useClockTick(60_000);
  const now = tick === null ? new Date() : new Date(tick);
  const todayEvents = (calendar?.today ?? []).filter((event) => event.end > now).sort(byStart);
  const weekEvents = (calendar?.upcoming ?? []).filter((event) => !sameDay(event.start, now, calendar?.timeZone)).sort(byStart);
  const nextEvent = calendar?.nextEvent;
  const hasEvents = Boolean(nextEvent || todayEvents.length || weekEvents.length);
  const timeZone = calendar?.timeZone;

  return <Widget accent="calendar" className="kiosk-calendar-widget" contentPadding={false} sceneVariant="cinematic" imageUrl="/kiosk/scenes/calendar/calendar-cosmic-workspace.png" imagePosition="center center" imageOpacity={1} imageBlur={0}>
    <div className="kiosk-time-scene kiosk-calendar-scene">
      <KioskSceneIdentity sceneLabel="COSMIC • CALENDAR" variant="inline" />
      <header className="kiosk-time-scene-heading"><div><p className="kiosk-time-scene-kicker">CALENDAR · TODAY</p><p className="kiosk-time-scene-date">{formatDate(now, { weekday: "long", month: "long", day: "numeric" }, timeZone)}<KioskConnectionStatus service="calendar" /></p></div>{error && calendar ? <p className="kiosk-time-scene-status">Updating</p> : null}</header>
      {loading && !calendar ? <div className="kiosk-time-scene-empty-state">Loading calendar…</div> : error && !calendar ? <div className="kiosk-time-scene-empty-state">Calendar temporarily unavailable</div> : !hasEvents ? <div className="kiosk-time-scene-empty-state"><p>Your day is clear</p><span>Nothing scheduled.</span></div> : <div className="kiosk-time-scene-grid">
        <section className="kiosk-time-scene-hero" aria-label="Up next"><p className="kiosk-time-scene-label">Up next</p>{nextEvent ? <><p className="kiosk-time-scene-hero-title">{nextEvent.title}</p><p className="kiosk-time-scene-hero-meta">{compactKioskLocation(nextEvent.location) ?? nextEvent.calendarName ?? "Personal calendar"}</p><p className="kiosk-time-scene-hero-due">{formatEventTime(nextEvent, timeZone, true)}</p></> : <p className="kiosk-time-scene-empty">No more events today</p>}</section>
        <div className="kiosk-time-scene-lists"><KioskEventList label={`TODAY · ${formatDate(now, { weekday: "long", month: "long", day: "numeric" }, timeZone)}`} items={todayEvents} timeZone={timeZone} excludeId={nextEvent?.id} empty="Nothing else scheduled today" /><KioskEventWeekList items={weekEvents} timeZone={timeZone} excludeId={nextEvent?.id} empty="No more events this week" /></div>
      </div>}
    </div>
  </Widget>;
}

function KioskEventList({ label, items, timeZone, excludeId, empty }: { label: string; items: CalendarEvent[]; timeZone?: string; excludeId?: string; empty: string }) {
  const visibleItems = items.filter((event) => event.id !== excludeId);
  return <section className="kiosk-time-scene-list" aria-label={label}><p className="kiosk-time-scene-label">{label}</p>{visibleItems.length ? <div className="kiosk-time-scene-rows">{visibleItems.slice(0, 6).map((event) => <div className="kiosk-time-scene-row" key={event.id}><div className="min-w-0"><p className="kiosk-time-scene-row-title">{event.title}</p><p className="kiosk-time-scene-row-meta">{compactKioskLocation(event.location) ?? event.calendarName ?? "Personal calendar"}</p></div><span className="kiosk-time-scene-row-time">{formatEventTime(event, timeZone)}</span></div>)}</div> : <p className="kiosk-time-scene-muted">{empty}</p>}</section>;
}

function KioskEventWeekList({ items, timeZone, excludeId, empty }: { items: CalendarEvent[]; timeZone?: string; excludeId?: string; empty: string }) {
  const visibleItems = items.filter((event) => event.id !== excludeId);
  const groups = visibleItems.reduce<Array<{ key: string; label: string; events: CalendarEvent[] }>>((result, event) => {
    const key = formatDate(event.start, { year: "numeric", month: "2-digit", day: "2-digit" }, timeZone);
    const group = result.find((item) => item.key === key);
    if (group) group.events.push(event); else result.push({ key, label: formatDate(event.start, { weekday: "short", month: "short", day: "numeric" }, timeZone).toUpperCase(), events: [event] });
    return result;
  }, []);
  return <section className="kiosk-time-scene-list" aria-label="This week"><p className="kiosk-time-scene-label">This week</p>{groups.length ? <div className="kiosk-time-scene-week-groups">{groups.slice(0, 7).map((group) => <div key={group.key}><p className="kiosk-time-scene-day-label">{group.label}</p><div className="kiosk-time-scene-rows">{group.events.slice(0, 6).map((event) => <div className="kiosk-time-scene-row" key={event.id}><div className="min-w-0"><p className="kiosk-time-scene-row-title">{event.title}</p><p className="kiosk-time-scene-row-meta">{compactKioskLocation(event.location) ?? event.calendarName ?? "Personal calendar"}</p></div><span className="kiosk-time-scene-row-time">{formatEventTime(event, timeZone)}</span></div>)}</div></div>)}</div> : <p className="kiosk-time-scene-muted">{empty}</p>}</section>;
}

function byStart(left: CalendarEvent, right: CalendarEvent) { return left.start.getTime() - right.start.getTime(); }
function formatEventTime(event: CalendarEvent, timeZone?: string, includeDate = false) { return event.allDay ? (includeDate ? formatDate(event.start, { weekday: "short", month: "short", day: "numeric" }, timeZone) : "All day") : event.start.toLocaleString([], { ...(includeDate ? { weekday: "short", month: "short", day: "numeric" } : {}), hour: "numeric", minute: "2-digit", ...(timeZone ? { timeZone } : {}) }); }
function formatDate(value: Date, options: Intl.DateTimeFormatOptions, timeZone?: string) { return value.toLocaleDateString([], { ...options, ...(timeZone ? { timeZone } : {}) }); }
function sameDay(left: Date, right: Date, timeZone?: string) { return formatDate(left, { year: "numeric", month: "2-digit", day: "2-digit" }, timeZone) === formatDate(right, { year: "numeric", month: "2-digit", day: "2-digit" }, timeZone); }
