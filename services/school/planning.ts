import type { SchoolAssignmentCompletion, SchoolPlanRecommendation, SchoolPlanningAssignment, SchoolPlanningPriority, SchoolTimelineEntry } from "@/core/contracts/SchoolPlanning";

const priorityWeight: Record<SchoolPlanningPriority, number> = { low: 0, normal: 10, high: 25, critical: 45 };

export function schoolAssignmentIdentity(input: Pick<SchoolPlanningAssignment, "sourceType" | "sourceId" | "externalId" | "id">) {
  if (input.sourceId && input.externalId) return `${input.sourceType}:${input.sourceId}:${input.externalId}`;
  if (input.sourceId) return `${input.sourceType}:${input.sourceId}`;
  return `${input.sourceType}:${input.id}`;
}

export function completionStatusFor(dueAt: Date | undefined, completed: boolean, now = new Date()): SchoolAssignmentCompletion {
  if (completed) return "completed";
  if (!dueAt) return "unknown";
  const distance = dueAt.getTime() - now.getTime();
  if (distance < 0) return "overdue";
  if (distance <= 48 * 60 * 60 * 1000) return "due_soon";
  return "upcoming";
}

function dayKey(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function groupSchoolAssignments(assignments: SchoolPlanningAssignment[], now = new Date(), timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  const today = dayKey(now, timeZone);
  const tomorrow = dayKey(new Date(now.getTime() + 86_400_000), timeZone);
  const weekEnd = new Date(now.getTime() + 7 * 86_400_000);
  const groups = { overdue: [], today: [], tomorrow: [], thisWeek: [], later: [], completed: [], undated: [] } as Record<string, SchoolPlanningAssignment[]>;
  for (const assignment of assignments) {
    if (assignment.completionStatus === "completed" || assignment.planningStatus === "done") { groups.completed.push(assignment); continue; }
    if (!assignment.dueAt) { groups.undated.push(assignment); continue; }
    if (assignment.dueAt < now) groups.overdue.push(assignment);
    else if (dayKey(assignment.dueAt, timeZone) === today) groups.today.push(assignment);
    else if (dayKey(assignment.dueAt, timeZone) === tomorrow) groups.tomorrow.push(assignment);
    else if (assignment.dueAt <= weekEnd) groups.thisWeek.push(assignment);
    else groups.later.push(assignment);
  }
  return groups;
}

export function rankSchoolAssignments(assignments: SchoolPlanningAssignment[], now = new Date()): SchoolPlanRecommendation[] {
  return assignments.filter((assignment) => assignment.completionStatus !== "completed" && assignment.planningStatus !== "done").map((assignment) => {
    const days = assignment.dueAt ? (assignment.dueAt.getTime() - now.getTime()) / 86_400_000 : 30;
    const urgency = assignment.dueAt ? days < 0 ? 100 + Math.min(50, Math.abs(days) * 5) : Math.max(0, 50 - days * 5) : 0;
    const score = Math.round(urgency + priorityWeight[assignment.priority] + (assignment.estimatedMinutes ? Math.min(15, assignment.estimatedMinutes / 30) : 0));
    const reason = days < 0 ? `Overdue by ${Math.max(1, Math.ceil(Math.abs(days)))} day${Math.ceil(Math.abs(days)) === 1 ? "" : "s"}` : days < 1 ? "Due today" : days < 2 ? "Due tomorrow" : assignment.priority !== "normal" && assignment.priority !== "low" ? `${assignment.priority[0].toUpperCase()}${assignment.priority.slice(1)} priority and due soon` : "Upcoming deadline";
    return { assignmentId: assignment.id, title: assignment.title, score, reason };
  }).sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}

export function buildSchoolTimeline(entries: SchoolTimelineEntry[]) {
  return [...entries].sort((a, b) => a.start.getTime() - b.start.getTime() || a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
}

export function hydrateSchoolPlanningAssignments(value: unknown): SchoolPlanningAssignment[] {
  if (!Array.isArray(value)) return [];
  const parsed: SchoolPlanningAssignment[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    if (typeof raw.id !== "string" || typeof raw.accountId !== "string" || typeof raw.title !== "string" || typeof raw.sourceType !== "string") continue;
    const parse = (candidate: unknown) => typeof candidate === "string" ? new Date(candidate) : undefined;
    const createdAt = parse(raw.createdAt); const updatedAt = parse(raw.updatedAt); if (!createdAt || !updatedAt || Number.isNaN(createdAt.getTime()) || Number.isNaN(updatedAt.getTime())) continue;
    const dueAt = parse(raw.dueAt); const availableAt = parse(raw.availableAt); const lockAt = parse(raw.lockAt); const lastSyncedAt = parse(raw.lastSyncedAt); const sourceUpdatedAt = parse(raw.sourceUpdatedAt);
    parsed.push({ ...(raw as unknown as SchoolPlanningAssignment), createdAt, updatedAt, ...(dueAt && !Number.isNaN(dueAt.getTime()) ? { dueAt } : {}), ...(availableAt && !Number.isNaN(availableAt.getTime()) ? { availableAt } : {}), ...(lockAt && !Number.isNaN(lockAt.getTime()) ? { lockAt } : {}), ...(lastSyncedAt && !Number.isNaN(lastSyncedAt.getTime()) ? { lastSyncedAt } : {}), ...(sourceUpdatedAt && !Number.isNaN(sourceUpdatedAt.getTime()) ? { sourceUpdatedAt } : {}) });
  }
  return parsed;
}

export function detectSchoolTimelineConflicts(entries: SchoolTimelineEntry[]) {
  const conflicts: Array<{ id: string; firstId: string; secondId: string; description: string }> = [];
  for (let index = 0; index < entries.length; index += 1) for (let next = index + 1; next < entries.length; next += 1) {
    const first = entries[index]; const second = entries[next];
    if (first.end && second.end && first.start < second.end && second.start < first.end) {
      const ids = [first.id, second.id].sort();
      conflicts.push({ id: `school-conflict:overlap:${ids.join(":")}`, firstId: ids[0], secondId: ids[1], description: `${first.title} overlaps ${second.title}.` });
    }
  }
  return conflicts;
}
