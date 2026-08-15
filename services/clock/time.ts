import type {
  Alarm,
  ClockHourFormat,
  ClockTimer,
  StopwatchState,
} from "@/core/contracts/Clock";

export const COMMON_TIME_ZONES = [
  { label: "Honolulu", timeZone: "Pacific/Honolulu" },
  { label: "Anchorage", timeZone: "America/Anchorage" },
  { label: "Los Angeles", timeZone: "America/Los_Angeles" },
  { label: "Denver", timeZone: "America/Denver" },
  { label: "Chicago", timeZone: "America/Chicago" },
  { label: "New York", timeZone: "America/New_York" },
  { label: "Toronto", timeZone: "America/Toronto" },
  { label: "São Paulo", timeZone: "America/Sao_Paulo" },
  { label: "London", timeZone: "Europe/London" },
  { label: "Paris", timeZone: "Europe/Paris" },
  { label: "Berlin", timeZone: "Europe/Berlin" },
  { label: "Cairo", timeZone: "Africa/Cairo" },
  { label: "Johannesburg", timeZone: "Africa/Johannesburg" },
  { label: "Dubai", timeZone: "Asia/Dubai" },
  { label: "Delhi", timeZone: "Asia/Kolkata" },
  { label: "Bangkok", timeZone: "Asia/Bangkok" },
  { label: "Singapore", timeZone: "Asia/Singapore" },
  { label: "Hong Kong", timeZone: "Asia/Hong_Kong" },
  { label: "Tokyo", timeZone: "Asia/Tokyo" },
  { label: "Seoul", timeZone: "Asia/Seoul" },
  { label: "Sydney", timeZone: "Australia/Sydney" },
  { label: "Auckland", timeZone: "Pacific/Auckland" },
] as const;

const DAY_MS = 86_400_000;

function hour12For(format: ClockHourFormat) {
  return format === "system" ? undefined : format === "12";
}

export function formatClockTime(
  value: Date | number,
  format: ClockHourFormat,
  options: { seconds?: boolean; timeZone?: string } = {},
) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: options.seconds ? "2-digit" : undefined,
    hour12: hour12For(format),
    timeZone: options.timeZone,
  }).format(value);
}

export function formatClockDate(value: Date | number, timeZone?: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone,
  }).format(value);
}

export function formatShortDate(value: Date | number, timeZone?: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone,
  }).format(value);
}

export function formatAmbientDate(value: Date | number, timeZone?: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone,
  }).format(value);
}

export function formatTimeZoneOffset(value: Date | number, timeZone: string) {
  const part = new Intl.DateTimeFormat(undefined, {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(value).find((entry) => entry.type === "timeZoneName");

  return part?.value ?? timeZone;
}

function calendarParts(value: Date | number, timeZone?: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).formatToParts(value);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return { year: read("year"), month: read("month"), day: read("day") };
}

export function getWorldClockDayDifference(value: Date | number, timeZone: string) {
  const local = calendarParts(value);
  const remote = calendarParts(value, timeZone);
  const localUtc = Date.UTC(local.year, local.month - 1, local.day);
  const remoteUtc = Date.UTC(remote.year, remote.month - 1, remote.day);
  return Math.round((remoteUtc - localUtc) / DAY_MS);
}

export function formatDayDifference(difference: number) {
  if (difference === -1) return "Yesterday";
  if (difference === 0) return "Today";
  if (difference === 1) return "Tomorrow";
  return difference < 0 ? `${Math.abs(difference)} days behind` : `${difference} days ahead`;
}

export function parseAlarmTime(time: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
    ? { hours, minutes }
    : null;
}

export function getNextAlarmOccurrence(alarm: Alarm, from: Date | number) {
  if (!alarm.enabled) return null;
  const fromTime = new Date(from).getTime();
  if (alarm.snoozedUntil && alarm.snoozedUntil > fromTime) {
    return new Date(alarm.snoozedUntil);
  }
  const parsed = parseAlarmTime(alarm.time);
  if (!parsed) return null;
  const start = new Date(from);
  const repeatDays = new Set(alarm.repeatWeekdays);

  for (let offset = 0; offset <= 7; offset += 1) {
    const candidate = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + offset,
      parsed.hours,
      parsed.minutes,
      0,
      0,
    );

    if (candidate.getTime() <= start.getTime()) continue;
    if (repeatDays.size > 0 && !repeatDays.has(candidate.getDay())) continue;
    return candidate;
  }

  return null;
}

export function getAlarmOccurrenceBetween(alarm: Alarm, start: number, end: number) {
  if (!alarm.enabled) return null;
  if (alarm.snoozedUntil && alarm.snoozedUntil > start && alarm.snoozedUntil <= end) {
    return alarm.snoozedUntil;
  }

  const occurrence = getNextAlarmOccurrence(alarm, start - 1)?.getTime() ?? null;
  if (occurrence === null || occurrence > end) return null;
  if (alarm.lastTriggeredAt && occurrence <= alarm.lastTriggeredAt) return null;
  return occurrence;
}

export function formatAlarmRepeat(days: number[]) {
  if (days.length === 0) return "Once";
  if (days.length === 7) return "Every day";
  if (days.length === 5 && [1, 2, 3, 4, 5].every((day) => days.includes(day))) {
    return "Weekdays";
  }
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return [...days].sort().map((day) => names[day]).join(", ");
}

export function formatNextOccurrence(value: Date | number) {
  const date = new Date(value);
  const today = new Date();
  const candidate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const difference = Math.round((candidate.getTime() - base.getTime()) / DAY_MS);
  const day = difference === 0 ? "Today" : difference === 1 ? "Tomorrow" : new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date);
  return `${formatClockTime(date, "system")} · ${day}`;
}

export function getTimerRemaining(timer: ClockTimer, now: number) {
  if (timer.status === "running" && timer.targetEndAt) {
    return Math.max(0, timer.targetEndAt - now);
  }
  return Math.max(0, timer.remainingAtPause);
}

export function formatDuration(milliseconds: number, showTenths = false) {
  const safe = Math.max(0, milliseconds);
  const totalSeconds = Math.floor(safe / 1_000);
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  const body = hours > 0
    ? `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    : `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return showTenths ? `${body}.${Math.floor((safe % 1_000) / 100)}` : body;
}

export function getStopwatchElapsed(stopwatch: StopwatchState, now: number) {
  return stopwatch.status === "running" && stopwatch.startedAt
    ? stopwatch.elapsedAtPause + Math.max(0, now - stopwatch.startedAt)
    : stopwatch.elapsedAtPause;
}
