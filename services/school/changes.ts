import type { SchoolSnapshot } from "./domain";

export type SchoolChangeType = "assignment_created" | "assignment_due_date_changed" | "assignment_overdue" | "school_event_created" | "school_event_time_changed" | "school_event_location_changed";

export interface SchoolChangeCandidate {
  id: string;
  type: SchoolChangeType;
  title: string;
  body: string;
  source: string;
  timestamp: string;
}

export type SchoolBaseline = Pick<SchoolSnapshot, "assignments" | "events" | "sourceStatus">;

export function serializeSchoolBaseline(snapshot: SchoolBaseline): string {
  return JSON.stringify(snapshot);
}

export function deserializeSchoolBaseline(value: string): SchoolBaseline | null {
  try {
    const parsed = JSON.parse(value) as SchoolBaseline;
    if (!Array.isArray(parsed.assignments) || !Array.isArray(parsed.events)) return null;
    return {
      sourceStatus: parsed.sourceStatus,
      assignments: parsed.assignments.map((item) => ({ ...item, due: new Date(item.due) })),
      events: parsed.events.map((item) => ({ ...item, start: new Date(item.start), end: new Date(item.end) })),
    };
  } catch { return null; }
}

export function detectSchoolChanges(previous: SchoolBaseline | null, current: SchoolSnapshot, now = new Date()): SchoolChangeCandidate[] {
  if (!previous || current.sourceStatus?.canvas === "error") return [];
  const changes: SchoolChangeCandidate[] = [];
  const oldAssignments = new Map(previous.assignments.map((item) => [item.id, item]));
  for (const assignment of current.assignments) {
    const old = oldAssignments.get(assignment.id);
    if (!old) changes.push({ id: `school:${assignment.id}:created`, type: "assignment_created", title: assignment.title, body: "New School assignment", source: "school", timestamp: now.toISOString() });
    else if (old.due.getTime() !== assignment.due.getTime()) changes.push({ id: `school:${assignment.id}:due:${assignment.due.toISOString()}`, type: "assignment_due_date_changed", title: assignment.title, body: `Due date changed to ${assignment.due.toLocaleString()}`, source: "school", timestamp: now.toISOString() });
    else if (!assignment.completed && assignment.due < now && old.due >= now) changes.push({ id: `school:${assignment.id}:overdue`, type: "assignment_overdue", title: assignment.title, body: "Due date passed", source: "school", timestamp: now.toISOString() });
  }
  const oldEvents = new Map(previous.events.map((item) => [`${item.source}:${item.id}`, item]));
  for (const event of current.events) {
    const old = oldEvents.get(`${event.source}:${event.id}`);
    if (!old) changes.push({ id: `school:event:${event.source}:${event.id}:created`, type: "school_event_created", title: event.title, body: "New School event", source: event.source, timestamp: now.toISOString() });
    else {
      if (old.start.getTime() !== event.start.getTime() || old.end.getTime() !== event.end.getTime()) changes.push({ id: `school:event:${event.source}:${event.id}:time:${event.start.toISOString()}`, type: "school_event_time_changed", title: event.title, body: "School event time changed", source: event.source, timestamp: now.toISOString() });
      if (old.location !== event.location) changes.push({ id: `school:event:${event.source}:${event.id}:location:${event.location ?? "none"}`, type: "school_event_location_changed", title: event.title, body: "School event location changed", source: event.source, timestamp: now.toISOString() });
    }
  }
  return changes;
}
