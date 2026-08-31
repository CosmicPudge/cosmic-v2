import type { CalendarEvent, CalendarSnapshot } from "@/core/contracts/Calendar";
import type { SchoolSnapshot } from "@/services/school/domain";

export function schoolSnapshotToCalendarEvents(snapshot: SchoolSnapshot): CalendarEvent[] {
  const events = snapshot.events.map((event) => ({
    id: `school:${event.source}:${event.id}`,
    uid: event.id,
    title: event.title,
    ...(event.description ? { description: event.description } : {}),
    start: event.start,
    end: event.end,
    ...(event.location ? { location: event.location } : {}),
    calendarName: "School",
    category: "school" as const,
    source: "school" as const,
    sourceId: `${event.source}:${event.id}`,
    sourceProvider: event.source,
    priority: event.type === "assignment" ? "high" as const : "normal" as const,
    travelRequired: false,
    completed: false,
  }));
  const eventIds = new Set(snapshot.events.map((event) => event.id));
  const assignments = snapshot.assignments
    .filter((assignment) => !eventIds.has(assignment.id))
    .map((assignment) => ({
      id: `school:assignment:${assignment.id}`,
      uid: assignment.id,
      title: assignment.title,
      start: assignment.due,
      end: assignment.due,
      allDay: true,
      calendarName: "School",
      category: "school" as const,
      source: "school" as const,
      sourceId: `assignment:${assignment.id}`,
      sourceProvider: "school",
      priority: "high" as const,
      travelRequired: false,
      completed: assignment.completed,
    }));
  const planningAssignments = (snapshot.planningAssignments ?? []).map((assignment) => ({
    id: `school:planning-assignment:${assignment.id}`,
    uid: assignment.id,
    title: assignment.title,
    ...(assignment.description ? { description: assignment.description } : {}),
    start: assignment.dueAt ?? assignment.createdAt,
    end: assignment.dueAt ?? assignment.createdAt,
    allDay: !assignment.dueAt,
    calendarName: "School",
    category: "school" as const,
    source: "school" as const,
    sourceId: `planning-assignment:${assignment.id}`,
    sourceProvider: assignment.sourceType,
    priority: assignment.priority === "critical" || assignment.priority === "high" ? "high" as const : "normal" as const,
    travelRequired: false,
    completed: assignment.completionStatus === "completed" || assignment.planningStatus === "done",
  }));
  const documentEvents = (snapshot.sourceIntelligence?.events ?? []).flatMap((event) => {
    if (event.status === "canceled") return [];
    if (!event.startsAt) return [];
    const start = new Date(event.startsAt);
    if (Number.isNaN(start.getTime())) return [];
    const end = event.endsAt ? new Date(event.endsAt) : new Date(start.getTime() + 60 * 60 * 1000);
    if (Number.isNaN(end.getTime())) return [];
    return [{
      id: `school:source:${event.id}`,
      uid: event.id,
      title: event.title,
      start,
      end,
      ...(event.location?.name ? { location: event.location.name } : {}),
      calendarName: "School",
      category: "school" as const,
      source: "school" as const,
      sourceId: event.provenance[0]?.sourceId ?? event.id,
      sourceProvider: "school-source",
      priority: "normal" as const,
      travelRequired: false,
      completed: false,
    }];
  });
  const legacyIds = new Set(assignments.map((item) => item.uid));
  return [...events, ...assignments, ...planningAssignments.filter((item) => !legacyIds.has(item.uid)), ...documentEvents];
}

export function mergeSchoolCalendarSnapshot(calendar: CalendarSnapshot, school: SchoolSnapshot): CalendarSnapshot {
  const events = [...calendar.today, ...calendar.upcoming, ...schoolSnapshotToCalendarEvents(school)];
  const unique = [...new Map(events.map((event) => [event.id, event])).values()].sort((a, b) => a.start.getTime() - b.start.getTime());
  const timeZone = calendar.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const dateKey = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  const todayKey = dateKey(new Date());
  const currentEvent = unique.find((event) => event.start <= new Date() && event.end > new Date());
  const nextEvent = unique.find((event) => event.start > new Date());
  return { ...calendar, today: unique.filter((event) => dateKey(event.start) === todayKey), upcoming: unique.filter((event) => dateKey(event.start) > todayKey), ...(currentEvent ? { currentEvent } : {}), ...(nextEvent ? { nextEvent } : {}) };
}
