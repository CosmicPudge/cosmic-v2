"use client";

import type { CalendarEvent, CalendarSnapshot } from "@/core/contracts";
import { useClockTick } from "@/hooks/os/useClock";
import { Widget } from "@/components/os/ui/widget";

interface Props {
  calendar: CalendarSnapshot | null;
  loading: boolean;
  error: string | null;
}

export default function KioskCalendarScene({ calendar, loading, error }: Props) {
  const tick = useClockTick(60_000);
  const now = tick === null ? null : new Date(tick);
  const displayDate = now ?? calendar?.today[0]?.start ?? calendar?.nextEvent?.start ?? null;
  const todayEvents = calendar?.today ?? [];
  const visibleEvents = todayEvents
    .filter((event) => now === null || event.end > now)
    .sort((left, right) => left.start.getTime() - right.start.getTime());
  const allDayEvents = visibleEvents.filter((event) => event.allDay);
  const timedEvents = visibleEvents.filter((event) => !event.allDay);
  const shownEvents = timedEvents.slice(0, 5);
  const overflowCount = Math.max(0, timedEvents.length - shownEvents.length);
  const nextEvent = calendar?.currentEvent ?? calendar?.nextEvent;

  return (
    <Widget accent="calendar" className="kiosk-calendar-widget" contentPadding={false} sceneVariant="cinematic" imageUrl="/kiosk/scenes/calendar/calendar-cosmic-workspace.png" imagePosition="center center" imageOpacity={1} imageBlur={0}>
      <div className="kiosk-calendar-scene relative flex h-full min-h-0 flex-col overflow-hidden px-5 pb-4 pt-6 text-white sm:px-10 sm:pb-7 sm:pt-8">
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-[clamp(.7rem,1.25vw,.9rem)] font-semibold uppercase tracking-[.26em] text-cyan-100/75">Calendar</p>
            <p className="mt-1 text-[clamp(1.1rem,2.5vw,1.8rem)] font-medium tracking-tight text-white/95">{displayDate?.toLocaleDateString(undefined, { weekday: "long" }) ?? "Today"}</p>
            <p className="text-[clamp(.75rem,1.5vw,1.05rem)] uppercase tracking-[.2em] text-white/60">{displayDate?.toLocaleDateString(undefined, { month: "long", day: "numeric" }) ?? ""}</p>
          </div>
          {error && calendar ? <p className="pt-1 text-[.58rem] uppercase tracking-[.16em] text-amber-100/70">Updating</p> : null}
        </div>

        {loading && !calendar ? (
          <div className="relative z-10 flex flex-1 items-center justify-center text-sm text-white/65">Loading calendar…</div>
        ) : error && !calendar ? (
          <div className="relative z-10 flex flex-1 items-center justify-center text-center text-sm text-white/70">Calendar temporarily unavailable<br /><span className="text-xs text-white/45">Cosmic will retry automatically.</span></div>
        ) : !calendar || (shownEvents.length === 0 && allDayEvents.length === 0 && !nextEvent) ? (
          <div className="relative z-10 flex flex-1 items-center justify-center text-center"><div><p className="text-xl font-light text-white/90">Nothing scheduled</p><p className="mt-1 text-sm text-white/55">Your calendar is clear.</p></div></div>
        ) : (
          <div className="relative z-10 mt-4 grid min-h-0 flex-1 gap-5 sm:grid-cols-[minmax(0,1.35fr)_minmax(13rem,.8fr)] sm:gap-8">
            <section className="min-h-0" aria-label="Today’s schedule">
              <p className="mb-2 text-[.58rem] font-semibold uppercase tracking-[.24em] text-white/50">Today’s schedule</p>
              {allDayEvents.length > 0 && <div className="mb-2 truncate rounded-lg border border-cyan-100/15 bg-cyan-100/[.07] px-3 py-1.5 text-xs text-cyan-50">All day · {allDayEvents.map((event) => event.title).join(" · ")}</div>}
              <div className="space-y-1.5">
                {shownEvents.map((event) => <TimelineEvent key={event.id} event={event} current={event.id === calendar.currentEvent?.id} />)}
              </div>
              {shownEvents.length === 0 && allDayEvents.length === 0 ? <p className="text-sm text-white/55">Nothing scheduled today.</p> : null}
              {overflowCount > 0 && <p className="mt-2 text-xs text-white/50">+{overflowCount} more today</p>}
            </section>

            <aside className="flex min-h-0 flex-col gap-3">
              {nextEvent ? <NextEvent event={nextEvent} current={nextEvent.id === calendar.currentEvent?.id} /> : null}
              {displayDate ? <DateStrip now={displayDate} events={[...todayEvents, ...(calendar?.upcoming ?? [])]} /> : null}
            </aside>
          </div>
        )}
      </div>
    </Widget>
  );
}

function TimelineEvent({ event, current }: { event: CalendarEvent; current: boolean }) {
  return <div className={`flex min-w-0 items-center gap-3 rounded-xl border px-3 py-2 ${current ? "border-cyan-200/45 bg-cyan-100/[.13]" : "border-white/10 bg-black/20"}`}><span className={`h-7 w-1 shrink-0 rounded-full ${current ? "bg-cyan-200" : "bg-white/25"}`} /><span className="w-[4.6rem] shrink-0 text-[.68rem] tabular-nums text-white/55">{formatEventTime(event)}</span><span className="min-w-0 flex-1 truncate text-[clamp(.72rem,1.35vw,.95rem)] font-medium text-white/90">{event.title}</span>{event.location ? <span className="hidden max-w-[8rem] truncate text-[.62rem] text-white/45 md:block">{event.location}</span> : null}</div>;
}

function NextEvent({ event, current }: { event: CalendarEvent; current: boolean }) {
  return <div className="rounded-xl border border-violet-100/20 bg-violet-100/[.08] p-3"><p className="text-[.58rem] font-semibold uppercase tracking-[.24em] text-violet-100/65">{current ? "Now" : "Next"}</p><p className="mt-1 truncate text-[clamp(.85rem,1.6vw,1.1rem)] font-medium text-white/95">{event.title}</p><p className="mt-1 text-xs tabular-nums text-white/60">{formatEventTime(event)}</p>{event.location ? <p className="mt-1 truncate text-xs text-white/45">{event.location}</p> : null}</div>;
}

function DateStrip({ now, events }: { now: Date; events: CalendarEvent[] }) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + index);
    return date;
  });
  return <div className="mt-auto rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-[.58rem] font-semibold uppercase tracking-[.24em] text-white/50">{now.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p><div className="mt-2 grid grid-cols-7 gap-1">{days.map((date) => { const count = events.filter((event) => sameDay(event.start, date)).length; const today = sameDay(date, now); return <div key={date.toISOString()} className={`rounded-lg px-1 py-1.5 text-center ${today ? "bg-cyan-200/20 text-cyan-50" : "text-white/55"}`}><p className="text-[.5rem] uppercase">{date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2)}</p><p className="mt-0.5 text-xs tabular-nums">{date.getDate()}</p><p className="mt-0.5 h-1 text-[.5rem] text-cyan-200/80">{count > 0 ? count : ""}</p></div>; })}</div></div>;
}

function formatEventTime(event: CalendarEvent) {
  if (event.allDay) return "All day";
  return event.start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function sameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}
