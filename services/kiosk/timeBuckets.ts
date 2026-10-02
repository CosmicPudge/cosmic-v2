export interface KioskTimedItem {
  start: string;
  end: string;
}

export interface KioskTimeBuckets<T> {
  next: T | undefined;
  today: T[];
  week: T[];
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
