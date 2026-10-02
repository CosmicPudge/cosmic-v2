export interface KioskTimedItem {
  start: string;
  end: string;
}

export interface KioskTimeBuckets<T> {
  next: T | undefined;
  today: T[];
  week: T[];
}

export interface KioskSchoolAssignmentItem {
  id: string;
  due: string;
  completed: boolean;
}

function asDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

function dayKey(value: Date) {
  return `${value.getFullYear()}-${value.getMonth()}-${value.getDate()}`;
}

export function buildKioskTimeBuckets<T extends KioskTimedItem>(items: T[], now = new Date()): KioskTimeBuckets<T> {
  const sorted = items
    .filter((item) => Number.isFinite(asDate(item.start).getTime()) && Number.isFinite(asDate(item.end).getTime()))
    .slice()
    .sort((left, right) => asDate(left.start).getTime() - asDate(right.start).getTime());
  const todayKey = dayKey(now);
  const tomorrow = new Date(now);
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekEnd = new Date(tomorrow);
  weekEnd.setDate(weekEnd.getDate() + 7);
  return {
    next: sorted.find((item) => asDate(item.end).getTime() > now.getTime()),
    today: sorted.filter((item) => dayKey(asDate(item.start)) === todayKey && asDate(item.end).getTime() > now.getTime()),
    week: sorted.filter((item) => asDate(item.start).getTime() >= tomorrow.getTime() && asDate(item.start).getTime() < weekEnd.getTime()),
  };
}

export function filterKioskSchoolAssignments<T extends KioskSchoolAssignmentItem>(items: T[], completedIds: Set<string>, now = new Date(), windowDays = 14) {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const futureWindow = now.getTime() + windowDays * 24 * 60 * 60 * 1000;
  return items.filter((item) => {
    const due = new Date(item.due);
    const dueDayStart = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    return !item.completed && !completedIds.has(item.id) && dueDayStart >= todayStart && due.getTime() <= futureWindow;
  });
}

export function formatKioskSchoolDue(value: string) {
  const date = new Date(value);
  const dateLabel = date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  const isDateOnly = date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0;
  return isDateOnly ? dateLabel : `${dateLabel} · ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}
