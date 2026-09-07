import type {
  CosmicCalendarEvent,
} from "../data/calendarClient";

export const CALENDAR_CONTEXT_LEAD_MS = 15 * 60_000;
export const CALENDAR_CONTEXT_GRACE_MS = 5 * 60_000;

const MAX_CALENDAR_CONTEXT_LINE_LENGTH = 25;

function truncateLine(content: string) {
  return content.length > MAX_CALENDAR_CONTEXT_LINE_LENGTH
    ? `${content.slice(0, MAX_CALENDAR_CONTEXT_LINE_LENGTH - 1)}…`
    : content;
}

function usefulLocation(location: string | null | undefined) {
  const normalized = location
    ?.replace(/\s+/g, " ")
    .trim();

  if (!normalized || normalized.length > MAX_CALENDAR_CONTEXT_LINE_LENGTH) {
    return "";
  }

  if (
    /^https?:\/\//i.test(normalized) ||
    /^www\./i.test(normalized) ||
    /^[{[]/.test(normalized) ||
    /(?:zoom\.us|meet\.google\.com|teams\.microsoft\.com)/i.test(normalized)
  ) {
    return "";
  }

  return normalized;
}

function countdownText(deltaMs: number) {
  if (deltaMs <= 0) {
    return "NOW";
  }

  const minutes = Math.max(1, Math.ceil(deltaMs / 60_000));
  return `${minutes} MIN`;
}

export function formatCalendarContext(
  event: CosmicCalendarEvent | null | undefined,
  now = Date.now(),
) {
  if (!event || event.allDay || event.cancelled) {
    return "";
  }

  const start = Date.parse(event.start);
  if (!Number.isFinite(start) || !event.title.trim()) {
    return "";
  }

  const deltaMs = start - now;
  if (
    deltaMs > CALENDAR_CONTEXT_LEAD_MS ||
    deltaMs < -CALENDAR_CONTEXT_GRACE_MS
  ) {
    return "";
  }

  const firstLine = truncateLine(
    `${event.title.trim()} • ${countdownText(deltaMs)}`,
  );
  const location = usefulLocation(event.location);

  return location
    ? `${firstLine}\n${truncateLine(location)}`
    : firstLine;
}

export function isCalendarContextRelevant(
  event: CosmicCalendarEvent | null | undefined,
  now = Date.now(),
) {
  return Boolean(formatCalendarContext(event, now));
}
