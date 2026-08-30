import type { SchoolDashboardData, SchoolEvent, SchoolAssignment } from "@/components/school/data/types";

export interface SchoolSnapshot {
  courses: SchoolDashboardData["classes"];
  assignments: SchoolAssignment[];
  events: SchoolEvent[];
  actionItems: SchoolAssignment[];
  facts: [];
  sources: Array<{ source: SchoolEvent["source"]; eventCount: number; assignmentCount: number }>;
  updatedAt: string;
  sourceStatus?: { canvas: "healthy" | "error" | "not_connected"; lastSyncedAt?: string | null };
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

export function schoolEventCalendarKey(event: Pick<SchoolEvent, "source" | "id">): string {
  return `${event.source}:${event.id}`;
}
