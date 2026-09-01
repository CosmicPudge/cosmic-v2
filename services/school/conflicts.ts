export interface ConflictCandidate { id: string; sourceId: string; type: string; payload: Record<string, unknown>; evidence: string; reviewState: string; }

function text(value: unknown) { return typeof value === "string" ? value.trim().toLocaleLowerCase().replace(/\s+/g, " ") : ""; }
function date(value: unknown) { return typeof value === "string" ? value.slice(0, 10) : ""; }

export function requirementConflict(existing: ConflictCandidate, incoming: ConflictCandidate) {
  if (existing.type !== "requirement" || incoming.type !== "requirement") return false;
  const a = existing.payload; const b = incoming.payload;
  const category = text(a.requirementCategory ?? a.kind) || "bring";
  if (category !== "wear" || category !== text(b.requirementCategory ?? b.kind)) return false;
  const sameCourse = text(a.courseId) === text(b.courseId);
  const sameDate = date(a.relevantDate) === date(b.relevantDate) || (text(a.relevantWeekday) && text(a.relevantWeekday) === text(b.relevantWeekday));
  const sameContext = !a.eventContext || !b.eventContext || text(a.eventContext) === text(b.eventContext);
  const valuesDiffer = text(a.value ?? a.content ?? existing.evidence) !== text(b.value ?? b.content ?? incoming.evidence);
  return sameCourse && sameDate && sameContext && valuesDiffer;
}

export function policyConflict(existing: ConflictCandidate, incoming: ConflictCandidate) {
  if (!(existing.type === "fact" || existing.type === "policy") || !(incoming.type === "fact" || incoming.type === "policy")) return false;
  const a = existing.payload; const b = incoming.payload;
  return text(a.courseId) === text(b.courseId) && text(a.subject ?? a.kind) === text(b.subject ?? b.kind) && text(a.value ?? existing.evidence) !== text(b.value ?? incoming.evidence);
}

export function conflictKey(existingId: string, incomingId: string) { return `conflict:${existingId}:${incomingId}`; }
