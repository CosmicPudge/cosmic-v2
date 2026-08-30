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
  const parseDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const timeline = data.timeline.flatMap((item) => {
    const start = parseDate(item.start);
    const end = item.end ? parseDate(item.end) : null;
    if (!start || (item.end && !end)) return [];
    return [{
      id: item.id,
      title: item.title,
      ...(item.subtitle ? { subtitle: item.subtitle } : {}),
      start,
      ...(end ? { end } : {}),
      type: item.type,
    }];
  });

  return {
    ...data,
    events: data.events.flatMap((event) => {
      const start = parseDate(event.start);
      const end = parseDate(event.end);
      return start && end ? [{ ...event, start, end }] : [];
    }),
    classes: data.classes.flatMap((schoolClass) => {
      const start = parseDate(schoolClass.start);
      const end = parseDate(schoolClass.end);
      return start && end ? [{ ...schoolClass, start, end }] : [];
    }),
    assignments: data.assignments.flatMap((assignment) => {
      const due = parseDate(assignment.due);
      return due ? [{ ...assignment, due }] : [];
    }),
    announcements: data.announcements.flatMap((announcement) => {
      const date = parseDate(announcement.date);
      return date ? [{ ...announcement, date }] : [];
    }),
    timeline,
  };
}
