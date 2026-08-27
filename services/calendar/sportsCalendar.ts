import type { CalendarEvent, CalendarSnapshot } from "@/core/contracts";
import type { SportsEvent, SportsSnapshot } from "@/core/contracts/Sports";

const DEFAULT_EVENT_DURATION_MS = 2 * 60 * 60 * 1000;

const SPORT_LABELS: Record<SportsEvent["sport"], string> = {
  mlb: "MLB",
  nfl: "NFL",
  nba: "NBA",
  mls: "MLS",
  f1: "Formula 1",
  nascar: "NASCAR",
  "college-football": "College Football",
};

export function sportsEventToCalendarEvent(event: SportsEvent): CalendarEvent {
  const end = event.end ?? new Date(event.start.getTime() + DEFAULT_EVENT_DURATION_MS);
  return {
    id: `sports:${event.sport}:${event.id}`,
    title: event.title,
    start: event.start,
    end,
    ...(event.venue ? { location: event.venue } : {}),
    calendarName: SPORT_LABELS[event.sport],
    category: "sports",
    source: "sports",
    sourceId: event.id,
    ...(event.providerName ? { sourceProvider: event.providerName } : {}),
    ...(event.sourceUrl ? { sourceUrl: event.sourceUrl } : {}),
    sportsStatus: event.status,
    priority: event.status === "live" || event.status === "delayed" ? "high" : "normal",
    travelRequired: false,
    completed: event.status === "final" || event.status === "cancelled",
  };
}

function dateKey(value: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function mergeUnique(events: CalendarEvent[]): CalendarEvent[] {
  const unique = new Map<string, CalendarEvent>();
  for (const event of events) unique.set(event.id, event);
  return [...unique.values()].sort((left, right) => left.start.getTime() - right.start.getTime());
}

export function buildKioskCalendarSnapshot(
  accountEvents: CalendarEvent[],
  sports: SportsSnapshot | null,
  now = new Date(),
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  accountCalendarConnected = false,
  accountCalendarError = false,
  sportsCalendarError = false,
): CalendarSnapshot {
  const sportsEvents = sports
    ? [...sports.live, ...sports.upcoming].map(sportsEventToCalendarEvent)
    : [];
  const events = mergeUnique([...accountEvents, ...sportsEvents]);
  const todayKey = dateKey(now, timeZone);
  const today = events.filter((event) => dateKey(event.start, timeZone) === todayKey);
  const upcoming = events.filter((event) => dateKey(event.start, timeZone) > todayKey);
  const currentEvent = events.find((event) => event.start <= now && event.end > now);
  const nextEvent = events.find((event) => event.start > now);
  return {
    today,
    upcoming,
    ...(currentEvent ? { currentEvent } : {}),
    ...(nextEvent ? { nextEvent } : {}),
    timeZone,
    accountCalendarConnected,
    accountCalendarError,
    sportsCalendarError,
  };
}
