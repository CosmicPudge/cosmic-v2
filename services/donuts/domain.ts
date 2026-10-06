export const DONUT_TIME_ZONE = "America/Denver";

export type ProductionStage =
  | "Accepted"
  | "Preparing ingredients"
  | "Kneading"
  | "First rise"
  | "Shaping"
  | "Second rise"
  | "Frying"
  | "Cooling"
  | "Glazing / Filling"
  | "Setting"
  | "Out for delivery"
  | "Delivered";

export const PRODUCTION_STAGES: ProductionStage[] = [
  "Accepted", "Preparing ingredients", "Kneading", "First rise", "Shaping",
  "Second rise", "Frying", "Cooling", "Glazing / Filling", "Setting",
  "Out for delivery", "Delivered",
];

export function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)})${digits.slice(3)}`;
  return `(${digits.slice(0, 3)})${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function canonicalPhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  const normalized = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return /^\d{10}$/.test(normalized) ? `+1${normalized}` : null;
}

function denverParts(date: Date): { year: number; month: number; day: number; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: DONUT_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour") % 24, minute: get("minute") };
}

/** Development placeholder: Thursday at 3:00 p.m. Denver time before the selected weekend. */
export function isCutoffOpen(selectedDate: string, now: Date, cutoffHour = 15): boolean {
  const [year, month, day] = selectedDate.split("-").map(Number);
  const selected = new Date(Date.UTC(year, month - 1, day));
  const selectedWeekday = selected.getUTCDay();
  if (selectedWeekday !== 0 && selectedWeekday !== 6) return false;
  const thursday = new Date(selected);
  thursday.setUTCDate(selected.getUTCDate() - (selectedWeekday === 6 ? 2 : 3));
  const current = denverParts(now);
  const currentDay = Date.UTC(current.year, current.month - 1, current.day);
  const cutoffDay = thursday.getTime();
  if (currentDay < cutoffDay) return true;
  if (currentDay > cutoffDay) return false;
  return current.hour < cutoffHour;
}

export function canAdvanceStage(current: ProductionStage, next: ProductionStage): boolean {
  return PRODUCTION_STAGES.indexOf(next) === PRODUCTION_STAGES.indexOf(current) + 1;
}

export function hasCapacity(ordered: number, requested: number, capacity: number): boolean {
  return capacity >= 0 && requested > 0 && ordered + requested <= capacity;
}

export function batchKey(date: string, window: string): string { return `${date}:${window}`; }
