"use client";

import Image from "next/image";
import { CalendarDays, MapPin } from "lucide-react";
import type React from "react";

import type { CalendarEvent, CalendarSnapshot } from "@/core/contracts";
import { useClockTick } from "@/hooks/os/useClock";
import { compactKioskLocation } from "@/services/kiosk/presentation";

interface Props {
  calendar: CalendarSnapshot | null;
  loading: boolean;
  error: string | null;
}

export default function KioskCalendarScene({ calendar, loading, error }: Props) {
  const tick = useClockTick(60_000);
  const now = tick === null ? new Date() : new Date(tick);
  const timeZone = calendar?.timeZone;
  const events = [...(calendar?.today ?? []), ...(calendar?.upcoming ?? [])]
    .filter(isPersonalKioskEvent)
    .filter((event, index, list) => list.findIndex((item) => personalEventKey(item) === personalEventKey(event)) === index)
    .filter((event) => event.end > now)
    .sort(byStart)
    .slice(0, 6);

  return (
    <section className="cosmos-kiosk-calendar" aria-label="Cosmos personal calendar">
      <Image
        className="cosmos-kiosk-calendar-background"
        src="/kiosk/scenes/calendar/calendar-cosmic-workspace.png"
        alt=""
        fill
        priority
        sizes="100vw"
      />
      <div className="cosmos-kiosk-calendar-shade" aria-hidden="true" />

      <header className="cosmos-kiosk-calendar-brand">
        <strong>COSMOS</strong>
        <span aria-hidden="true">•</span>
        <span>CALENDAR</span>
      </header>

      <div className="cosmos-kiosk-calendar-heading">
        <h1>Personal Calendar</h1>
        <p>
          <strong>Today</strong>
          <span aria-hidden="true">|</span>
          <span>{formatDate(now, { weekday: "long", month: "long", day: "numeric" }, timeZone)}</span>
        </p>
      </div>

      {loading && !calendar ? (
        <div className="cosmos-kiosk-calendar-state">Loading calendar…</div>
      ) : error && !calendar ? (
        <div className="cosmos-kiosk-calendar-state">Calendar temporarily unavailable</div>
      ) : (
        <div className="cosmos-kiosk-calendar-layout">
          <div className="cosmos-kiosk-calendar-agenda" aria-label="Upcoming personal events">
            {events.length ? events.map((event, index) => (
              <article
                className={`cosmos-kiosk-calendar-event ${index === 0 ? "is-next" : ""}`}
                key={event.id}
                style={{ "--calendar-accent": calendarAccent(event) } as React.CSSProperties}
              >
                <div className="cosmos-kiosk-calendar-time">
                  <strong>{formatEventTime(event, timeZone)}</strong>
                  <span>{formatEventEnd(event, timeZone)}</span>
                </div>
                <div className="cosmos-kiosk-calendar-icon" aria-hidden="true">
                  <CalendarDays size={24} strokeWidth={1.9} />
                </div>
                <div className="cosmos-kiosk-calendar-event-main">
                  <div className="cosmos-kiosk-calendar-event-kicker">
                    <span className="cosmos-kiosk-calendar-event-day">{eventDayLabel(event, now, timeZone)}</span>
                    {index === 0 ? <span className="cosmos-kiosk-calendar-next-pill">UP NEXT</span> : null}
                  </div>
                  <h2>{event.title}</h2>
                  <p>
                    <MapPin size={16} strokeWidth={2.1} aria-hidden="true" />
                    {compactKioskLocation(event.location) ?? event.calendarName ?? "Personal calendar"}
                  </p>
                </div>
                <div className="cosmos-kiosk-calendar-source">{event.calendarName ?? categoryLabel(event)}</div>
              </article>
            )) : (
              <div className="cosmos-kiosk-calendar-empty">
                <strong>Your day is clear</strong>
                <span>Nothing scheduled.</span>
              </div>
            )}
          </div>

          <MiniMonth now={now} events={events} timeZone={timeZone} />
        </div>
      )}
    </section>
  );
}

function MiniMonth({ now, events, timeZone }: { now: Date; events: CalendarEvent[]; timeZone?: string }) {
  const year = Number(formatDate(now, { year: "numeric" }, timeZone));
  const month = Number(formatDate(now, { month: "numeric" }, timeZone)) - 1;
  const today = Number(formatDate(now, { day: "numeric" }, timeZone));
  const first = new Date(year, month, 1);
  const leading = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousDays = new Date(year, month, 0).getDate();
  const eventDays = new Set(events.map((event) => Number(formatDate(event.start, { day: "numeric" }, timeZone))));

  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - leading + 1;
    if (day < 1) return { day: previousDays + day, muted: true };
    if (day > daysInMonth) return { day: day - daysInMonth, muted: true };
    return { day, muted: false };
  });

  return (
    <aside className="cosmos-kiosk-calendar-month" aria-label="Current month">
      <h2>{formatDate(now, { month: "long", year: "numeric" }, timeZone)}</h2>
      <div className="cosmos-kiosk-calendar-weekdays">
        {["SUN","MON","TUE","WED","THU","FRI","SAT"].map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="cosmos-kiosk-calendar-month-grid">
        {cells.map((cell, index) => (
          <div
            key={`${cell.day}-${index}`}
            className={[
              "cosmos-kiosk-calendar-day",
              cell.muted ? "is-muted" : "",
              !cell.muted && cell.day === today ? "is-today" : "",
              !cell.muted && eventDays.has(cell.day) ? "has-event" : "",
            ].filter(Boolean).join(" ")}
          >
            <span>{cell.day}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

function eventDayLabel(event: CalendarEvent, now: Date, timeZone?: string) {
  const eventKey = formatDate(event.start, { year: "numeric", month: "2-digit", day: "2-digit" }, timeZone);
  const todayKey = formatDate(now, { year: "numeric", month: "2-digit", day: "2-digit" }, timeZone);
  const tomorrow = new Date(now.getTime() + 86_400_000);
  const tomorrowKey = formatDate(tomorrow, { year: "numeric", month: "2-digit", day: "2-digit" }, timeZone);
  if (eventKey === todayKey) return "TODAY";
  if (eventKey === tomorrowKey) return "TOMORROW";
  return formatDate(event.start, { weekday: "short", month: "short", day: "numeric" }, timeZone).toUpperCase();
}

const PERSONAL_KIOSK_CALENDARS = new Set(["not available", "stetson work", "school", "cosmic ai"]);

function normalizeCalendarName(value: string | undefined) {
  const name = (value ?? "").trim().toLowerCase().replace(/\\s+/g, " ");
  return name;
}

function isPersonalKioskEvent(event: CalendarEvent) {
  return PERSONAL_KIOSK_CALENDARS.has(normalizeCalendarName(event.calendarName));
}

function personalEventKey(event: CalendarEvent) {
  return [normalizeCalendarName(event.calendarName), event.title.trim().toLowerCase(), event.start.getTime(), event.end.getTime(), event.allDay ? "all-day" : "timed"].join("|");
}

function calendarAccent(event: CalendarEvent) {
  const name = (event.calendarName ?? "").trim().toLowerCase();
  if (name === "school") return "#3b82f6";
  if (name === "not available") return "#22c55e";
  if (name === "stetson work" || name === "work") return "#8b5cf6";
  if (name === "cosmic ai") return "#d946ef";
  return "#a855f7";
}

function categoryLabel(event: CalendarEvent) {
  return event.category ? String(event.category).replaceAll("_", " ") : "Personal";
}

function byStart(left: CalendarEvent, right: CalendarEvent) {
  return left.start.getTime() - right.start.getTime();
}

function formatEventTime(event: CalendarEvent, timeZone?: string) {
  if (event.allDay) return "All day";
  return event.start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", ...(timeZone ? { timeZone } : {}) });
}

function formatEventEnd(event: CalendarEvent, timeZone?: string) {
  if (event.allDay) return "";
  return `– ${event.end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", ...(timeZone ? { timeZone } : {}) })}`;
}

function formatDate(value: Date, options: Intl.DateTimeFormatOptions, timeZone?: string) {
  return value.toLocaleDateString([], { ...options, ...(timeZone ? { timeZone } : {}) });
}
