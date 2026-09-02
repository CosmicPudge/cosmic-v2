import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";

export function canonicalCanvasCalendarId(id: string) { return id.startsWith("canvas-calendar:") ? id : `canvas-calendar:${id}`; }
function identity(item: SchoolPlanningAssignment) { return item.canvasUrl || (item.externalId ? `${item.sourceType}:${item.externalId}` : item.id); }

/** Merge provider projections without collapsing unrelated same-title work. */
export function dedupeSchoolAssignments(items: SchoolPlanningAssignment[]) {
  const merged = new Map<string, SchoolPlanningAssignment>();
  for (const item of items) {
    const key = identity(item); const current = merged.get(key);
    if (!current) { merged.set(key, item); continue; }
    const preferred = current.sourceType === "canvas-api" ? current : item.sourceType === "canvas-api" ? item : current;
    merged.set(key, { ...preferred, title: item.sourceType === "canvas-api" ? item.title : preferred.title, ...(item.description ? { description: item.description } : {}), ...(item.dueAt ? { dueAt: item.dueAt } : {}), ...(item.canvasUrl ? { canvasUrl: item.canvasUrl } : {}), provenance: [...(current.provenance ?? []), ...(item.provenance ?? [])] });
  }
  return [...merged.values()];
}
