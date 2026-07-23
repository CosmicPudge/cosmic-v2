import { SchoolEvent } from "../types";

export function isToday(date: Date): boolean {
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function isTomorrow(date: Date): boolean {
  const tomorrow = new Date();

  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate()
  );
}

export function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

export function sortEvents(events: SchoolEvent[]): SchoolEvent[] {
  return [...events].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );
}

export function todayEvents(events: SchoolEvent[]): SchoolEvent[] {
  return events.filter(event => isToday(event.start));
}