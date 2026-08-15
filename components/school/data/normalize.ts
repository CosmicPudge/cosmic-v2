import type { SchoolDashboardData } from "./types";

type SerializedSchoolDashboardData = Omit<
  SchoolDashboardData,
  "events" | "classes" | "assignments" | "announcements" | "timeline"
> & {
  events: Array<Omit<SchoolDashboardData["events"][number], "start" | "end"> & { start: string; end: string }>;
  classes: Array<Omit<SchoolDashboardData["classes"][number], "start" | "end"> & { start: string; end: string }>;
  assignments: Array<Omit<SchoolDashboardData["assignments"][number], "due"> & { due: string }>;
  announcements: Array<Omit<SchoolDashboardData["announcements"][number], "date"> & { date: string }>;
  timeline: Array<Omit<SchoolDashboardData["timeline"][number], "start" | "end"> & { start: string; end?: string }>;
};

export function hydrateSchoolDashboard(
  data: SerializedSchoolDashboardData
): SchoolDashboardData {
  const timeline = data.timeline.map((item) => ({
    id: item.id,
    title: item.title,
    ...(item.subtitle ? { subtitle: item.subtitle } : {}),
    start: new Date(item.start),
    ...(item.end ? { end: new Date(item.end) } : {}),
    type: item.type,
  }));

  return {
    ...data,
    events: data.events.map((event) => ({ ...event, start: new Date(event.start), end: new Date(event.end) })),
    classes: data.classes.map((schoolClass) => ({ ...schoolClass, start: new Date(schoolClass.start), end: new Date(schoolClass.end) })),
    assignments: data.assignments.map((assignment) => ({ ...assignment, due: new Date(assignment.due) })),
    announcements: data.announcements.map((announcement) => ({ ...announcement, date: new Date(announcement.date) })),
    timeline,
  };
}
