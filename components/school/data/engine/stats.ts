import {
  DashboardStats,
  SchoolAssignment,
  SchoolClass,
  SchoolEvent,
} from "../types";

export function buildStats(
  classes: SchoolClass[],
  assignments: SchoolAssignment[],
  events: SchoolEvent[]
): DashboardStats {
  const today = new Date();

  const assignmentsDueToday = assignments.filter(
    (assignment) =>
      assignment.due.toDateString() ===
      today.toDateString()
  ).length;

  const afrotcEvents = events.filter((event) =>
    event.title.toLowerCase().includes("afrotc")
  ).length;

  return {
    classesToday: classes.length,
    assignmentsDueToday,
    afrotcEvents,
  };
}