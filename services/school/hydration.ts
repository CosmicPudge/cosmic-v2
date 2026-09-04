import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";

export function safeSchoolDate(value: unknown): Date | undefined {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const dateOnly = typeof value === "string" && /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.getFullYear() === Number(year) && date.getMonth() === Number(month) - 1 && date.getDate() === Number(day) ? date : undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function hydrateSchoolPlanningAssignments(value: unknown): SchoolPlanningAssignment[] {
  if (!Array.isArray(value)) return [];
  const parsed: SchoolPlanningAssignment[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    if (typeof raw.id !== "string" || typeof raw.accountId !== "string" || typeof raw.title !== "string" || typeof raw.sourceType !== "string") continue;
    const createdAt = safeSchoolDate(raw.createdAt); const updatedAt = safeSchoolDate(raw.updatedAt); if (!createdAt || !updatedAt) continue;
    const dueAt = safeSchoolDate(raw.dueAt); const availableAt = safeSchoolDate(raw.availableAt); const lockAt = safeSchoolDate(raw.lockAt); const lastSyncedAt = safeSchoolDate(raw.lastSyncedAt); const sourceUpdatedAt = safeSchoolDate(raw.sourceUpdatedAt);
    const { dueAt: _rawDueAt, availableAt: _rawAvailableAt, lockAt: _rawLockAt, lastSyncedAt: _rawLastSyncedAt, sourceUpdatedAt: _rawSourceUpdatedAt, ...base } = raw;
    parsed.push({ ...(base as unknown as SchoolPlanningAssignment), createdAt, updatedAt, ...(dueAt ? { dueAt } : {}), ...(availableAt ? { availableAt } : {}), ...(lockAt ? { lockAt } : {}), ...(lastSyncedAt ? { lastSyncedAt } : {}), ...(sourceUpdatedAt ? { sourceUpdatedAt } : {}) });
  }
  return parsed;
}
