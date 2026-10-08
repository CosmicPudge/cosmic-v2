"use client";

import Image from "next/image";
import { BriefcaseBusiness, CalendarDays, Clock3, Home, MapPin } from "lucide-react";

import type { CalendarEvent, CalendarSnapshot } from "@/core/contracts";
import { useClockTick } from "@/hooks/os/useClock";

interface Props {
  calendar: CalendarSnapshot | null;
  loading: boolean;
  error: string | null;
}

export default function KioskCalendarScene({ calendar, loading, error }: Props) {
  const tick = useClockTick(60_000);
  const now = tick === null ? new Date() : new Date(tick);
  const timeZone = calendar?.timeZone;

  const todayEvents = (calendar?.today ?? [])
    .filter((event) => event.end > now)
    .sort(byStart)
    .slice(0, 6);

  const upcoming = (calendar?.upcoming ?? [])
    .filter((event) => event.end > now)
    .sort(byStart);

  const nextEvent = calendar?.nextEvent ?? todayEvents[0] ?? upcoming[0];
  const visibleToday = todayEvents.length ? todayEvents : upcoming.filter((event) => sameDay(event.start, now, timeZone)).slice(0, 6);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const allEvents = [...(calendar?.today ?? []), ...(calendar?.upcoming ?? [])];
  const eventDays = new Set(
    allEvents
      .filter((event) => event.start >= monthStart && event.start <= new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate(), 23, 59, 59, 999))
      .map((event) => dateKey(event.start, timeZone))
  );

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

      <div className="cosmos-kiosk-calendar-title-block">
        <h1>Personal Calendar</h1>
        <p>
          <strong>Today</strong>
          <span aria-hidden="true">|</span>
          {formatDate(now, { weekday: "long", month: "long", day: "numeric" }, timeZone)}
        </p>
      </div>

      {loading && !calendar ? (
        <div className="cosmos-kiosk-calendar-state">Loading your calendars…</div>
      ) : error && !calendar ? (
        <div className="cosmos-kiosk-calendar-state">Calendar temporarily unavailable</div>
      ) : (
        <div className="cosmos-kiosk-calendar-layout">
          <div className="cosmos-kiosk-calendar-agenda">
            {visibleToday.length ? visibleToday.map((event) => (
              <CalendarRow
                key={event.id}
                event={event}
                timeZone={timeZone}
                isNext={nextEvent?.id === event.id}
              />
            )) : (
              <div className="cosmos-kiosk-calendar-empty">
                <CalendarDays size={34} />
                <div>
                  <strong>Your day is clear</strong>
                  <span>No personal events scheduled.</span>
                </div>
              </div>
            )}
          </div>

          <MiniMonth
            now={now}
            timeZone={timeZone}
            eventDays={eventDays}
          />
        </div>
      )}
    </section>
  );
}

function CalendarRow({
  event,
  timeZone,
  isNext,
}: {
  event: CalendarEvent;
  timeZone?: string;
  isNext: boolean;
}) {
  const category = resolveCalendarCategory(event);
  const Icon = category === "work" ? BriefcaseBusiness : category === "home" ? Home : CalendarDays;

  return (
    <article className={`cosmos-kiosk-calendar-row ${isNext ? "is-next" : ""}`}>
      <div className="cosmos-kiosk-calendar-time">
        <span className="cosmos-kiosk-calendar-dot" />
        <strong>{formatStart(event, timeZone)}</strong>
        <span>{formatEnd(event, timeZone)}</span>
      </div>

      <div className="cosmos-kiosk-calendar-icon">
        <Icon size={28} strokeWidth={1.9} />
      </div>

      <div className="cosmos-kiosk-calendar-event">
        {isNext ? <span className="cosmos-kiosk-calendar-next-pill">UP NEXT</span> : null}
        <strong>{event.title}</strong>
        <span>
          {event.location ? <MapPin size={16} /> : <Clock3 size={16} />}
          {event.location ?? event.calendarName ?? "Personal calendar"}
        </span>
      </div>

      <span className={`cosmos-kiosk-calendar-tag tag-${category}`}>
        {event.calendarName ?? categoryLabel(category)}
      </span>
    </article>
  );
}

function MiniMonth({
  now,
  timeZone,
  eventDays,
}: {
  now: Date;
  timeZone?: string;
  eventDays: Set<string>;
}) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = first.getDay();
  const previousDays = new Date(year, month, 0).getDate();
  const cells: Array<{ date: Date; current: boolean }> = [];

  for (let index = leading - 1; index >= 0; index -= 1) {
    cells.push({ date: new Date(year, month - 1, previousDays - index), current: false });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: new Date(year, month, day), current: true });
  }
  while (cells.length < 42) {
    const day = cells.length - leading - daysInMonth + 1;
    cells.push({ date: new Date(year, month + 1, day), current: false });
  }

  return (
    <aside className="cosmos-kiosk-calendar-month">
      <div className="cosmos-kiosk-calendar-month-title">
        {formatDate(now, { month: "long", year: "numeric" }, timeZone)}
      </div>

      <div className="cosmos-kiosk-calendar-weekdays">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => <span key={day}>{day}</span>)}
      </div>

      <div className="cosmos-kiosk-calendar-month-grid">
        {cells.map(({ date, current }, index) => {
          const active = sameDay(date, now, timeZone);
          const hasEvent = eventDays.has(dateKey(date, timeZone));
          return (
            <div key={`${date.toISOString()}-${index}`} className={`cosmos-kiosk-calendar-day ${current ? "" : "is-muted"} ${active ? "is-today" : ""}`}>
              <span>{date.getDate()}</span>
              {hasEvent ? <i aria-hidden="true" /> : null}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function resolveCalendarCategory(event: CalendarEvent) {
  const value = `${event.calendarName ?? ""} ${event.category ?? ""} ${event.title}`.toLowerCase();
  if (value.includes("work")) return "work";
  if (value.includes("school") || value.includes("class")) return "school";
  if (value.includes("not available") || value.includes("busy")) return "busy";
  if (value.includes("cosmic")) return "cosmic";
  if (value.includes("home") || value.includes("personal")) return "home";
  return "personal";
}

function categoryLabel(category: ReturnType<typeof resolveCalendarCategory>) {
  if (category === "busy") return "Not Available";
  if (category === "cosmic") return "Cosmic AI";
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function formatStart(event: CalendarEvent, timeZone?: string) {
  if (event.allDay) return "ALL DAY";
  return event.start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", ...(timeZone ? { timeZone } : {}) });
}

function formatEnd(event: CalendarEvent, timeZone?: string) {
  if (event.allDay) return "";
  return `– ${event.end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", ...(timeZone ? { timeZone } : {}) })}`;
}

function byStart(left: CalendarEvent, right: CalendarEvent) {
  return left.start.getTime() - right.start.getTime();
}

function formatDate(value: Date, options: Intl.DateTimeFormatOptions, timeZone?: string) {
  return value.toLocaleDateString([], { ...options, ...(timeZone ? { timeZone } : {}) });
}

function dateKey(value: Date, timeZone?: string) {
  return formatDate(value, { year: "numeric", month: "2-digit", day: "2-digit" }, timeZone);
}

function sameDay(left: Date, right: Date, timeZone?: string) {
  return dateKey(left, timeZone) === dateKey(right, timeZone);
}
