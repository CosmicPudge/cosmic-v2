const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
export type RequirementCategory = "bring" | "wear" | "prepare" | "read" | "equipment" | "material";

export function resolveRequirementDate(payload: Record<string, unknown>, reference: Date): Date | undefined {
  const explicit = typeof payload.relevantDate === "string" ? new Date(payload.relevantDate) : undefined;
  if (explicit && !Number.isNaN(explicit.getTime())) return explicit;
  const day = typeof payload.relevantWeekday === "string" ? weekdays.indexOf(payload.relevantWeekday.toLowerCase()) : -1;
  if (day < 0) return undefined;
  const result = new Date(reference); result.setHours(0, 0, 0, 0); const delta = (day - result.getDay() + 7) % 7; result.setDate(result.getDate() + delta);
  return result;
}

export function requirementCategory(value: unknown): RequirementCategory {
  return value === "wear" || value === "prepare" || value === "read" || value === "equipment" || value === "material" ? value : "bring";
}
