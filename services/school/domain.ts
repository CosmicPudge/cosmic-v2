import type { SchoolDashboardData, SchoolEvent, SchoolAssignment } from "@/components/school/data/types";
import type { SchoolSourceIntelligence } from "@/core/contracts/SchoolIntelligence";
import type { SchoolPlanRecommendation, SchoolPlanningAssignment, SchoolTimelineEntry } from "@/core/contracts/SchoolPlanning";
import { hydrateSchoolPlanningAssignments, safeSchoolDate } from "./hydration";
import type { CoursePlan } from "./coursePlan";

export interface SchoolNoteSummary { id: string; courseId?: string; sourceId?: string; title: string; content: string; classDate?: Date; topics: string[]; createdAt: Date; updatedAt: Date; provenance?: unknown; }
export interface SchoolTopic { value: string; noteId: string; courseId?: string; sourceId?: string; createdAt: Date; }
export interface SchoolRequirement { id: string; courseId?: string; category: "bring" | "wear" | "prepare" | "read" | "equipment" | "material"; value: string; sourceId: string; evidence: string; relevantDate?: Date; eventContext?: string; recurrence?: "once" | "recurring"; }
export interface SchoolImportantFact { id: string; subject: string; value: string; sourceId: string; evidence: string; }

export interface SchoolCanvasCourse { id: string; name: string; courseCode?: string; startAt?: string; endAt?: string; workflowState?: string; url?: string; }

export interface SchoolSnapshot {
  courses: SchoolDashboardData["classes"];
  assignments: SchoolAssignment[];
  events: SchoolEvent[];
  actionItems: SchoolAssignment[];
  facts: [];
  notes: SchoolNoteSummary[];
  topics: SchoolTopic[];
  requirements: SchoolRequirement[];
  importantFacts: SchoolImportantFact[];
  sources: Array<{ source: SchoolEvent["source"]; eventCount: number; assignmentCount: number }>;
  updatedAt: string;
  sourceStatus?: { canvas: "healthy" | "error" | "not_connected"; lastSyncedAt?: string | null };
  sourceIntelligence?: SchoolSourceIntelligence;
  planningAssignments?: SchoolPlanningAssignment[];
  timelineEntries?: SchoolTimelineEntry[];
  planningRecommendations?: SchoolPlanRecommendation[];
  conflicts?: Array<{ id: string; firstId: string; secondId: string; description: string }>;
  canvasCourses?: SchoolCanvasCourse[];
  coursePlans?: CoursePlan[];
}

/** The single client boundary for dates arriving through JSON/API serialization. */
export function hydrateSchoolSnapshot(raw: unknown): SchoolSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<SchoolSnapshot>;
  if (!Array.isArray(value.assignments) || !Array.isArray(value.events)) return null;
  const assignments = value.assignments.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as unknown as Record<string, unknown>;
    const due = safeSchoolDate(candidate.due);
    return typeof candidate.id === "string" && typeof candidate.title === "string" && due ? [{ ...item, due } as SchoolSnapshot["assignments"][number]] : [];
  });
  const events = value.events.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as unknown as Record<string, unknown>;
    const start = safeSchoolDate(candidate.start); const end = safeSchoolDate(candidate.end);
    return typeof candidate.id === "string" && typeof candidate.title === "string" && start && end ? [{ ...item, start, end } as SchoolSnapshot["events"][number]] : [];
  });
  const notes = Array.isArray(value.notes) ? value.notes.flatMap((note) => { if (!note || typeof note !== "object") return []; const item = note as unknown as Record<string, unknown>; const createdAt = safeSchoolDate(item.createdAt); const updatedAt = safeSchoolDate(item.updatedAt); return typeof item.id === "string" && typeof item.title === "string" && typeof item.content === "string" && createdAt && updatedAt ? [{ ...item, createdAt, updatedAt, ...(safeSchoolDate(item.classDate) ? { classDate: safeSchoolDate(item.classDate)! } : {}) } as SchoolNoteSummary] : []; }).slice(0, 25) : [];
  return { ...(value as SchoolSnapshot), assignments, events, actionItems: assignments.filter((item) => !item.completed), notes, topics: Array.isArray(value.topics) ? value.topics.slice(0, 50).flatMap((topic) => { if (!topic || typeof topic !== "object") return []; const item = topic as unknown as Record<string, unknown>; const createdAt = safeSchoolDate(item.createdAt); return typeof item.value === "string" && typeof item.noteId === "string" && createdAt ? [{ ...item, createdAt } as SchoolTopic] : []; }) : [], requirements: Array.isArray(value.requirements) ? value.requirements.slice(0, 50).flatMap((requirement) => { if (!requirement || typeof requirement !== "object") return []; const item = requirement as unknown as Record<string, unknown>; const relevantDate = safeSchoolDate(item.relevantDate); return typeof item.id === "string" && typeof item.value === "string" && typeof item.sourceId === "string" && typeof item.evidence === "string" ? [{ ...item, ...(relevantDate ? { relevantDate } : {}) } as SchoolRequirement] : []; }) : [], importantFacts: Array.isArray(value.importantFacts) ? value.importantFacts.slice(0, 50) as SchoolImportantFact[] : [], ...(value.planningAssignments ? { planningAssignments: hydrateSchoolPlanningAssignments(value.planningAssignments) } : {}), ...(value.timelineEntries ? { timelineEntries: value.timelineEntries.flatMap((entry) => { const start = safeSchoolDate(entry.start); const end = safeSchoolDate(entry.end); return start ? [{ ...entry, start, ...(end ? { end } : {}) }] : []; }) } : {}) };
}

function stableEventKey(event: SchoolEvent): string {
  return `${event.source}:${event.id}`;
}

/**
 * The shared, credential-free School read model. Provider routes perform
 * authorization before supplying data here; consumers never receive feed
 * URLs or provider credentials.
 */
export function buildSchoolSnapshot(data: SchoolDashboardData, updatedAt = new Date()): SchoolSnapshot {
  const events = [...new Map(data.events.map((event) => [stableEventKey(event), event])).values()];
  const assignments = [...new Map(data.assignments.map((assignment) => [assignment.id, assignment])).values()];
  const sourceNames = [...new Set(events.map((event) => event.source))];

  return {
    courses: data.classes,
    assignments,
    events,
    actionItems: assignments.filter((assignment) => !assignment.completed),
    facts: [],
    notes: [], topics: [], requirements: [], importantFacts: [],
    sources: sourceNames.map((source) => ({
      source,
      eventCount: events.filter((event) => event.source === source).length,
      // Current Canvas normalization produces SchoolAssignment values without
      // a per-assignment source field; those assignments come from the
      // canvas-calendar snapshot represented by this source.
      assignmentCount: source === "canvas-calendar" ? assignments.length : 0,
    })),
    updatedAt: updatedAt.toISOString(),
  };
}

export function emptySchoolSourceIntelligence(): SchoolSourceIntelligence {
  return { facts: [], events: [], actionItems: [], conflicts: [], warnings: [] };
}

export function schoolEventCalendarKey(event: Pick<SchoolEvent, "source" | "id">): string {
  return `${event.source}:${event.id}`;
}
