import { SchoolDashboardData } from "../types";

export interface SchoolMetrics {
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  overdueAssignments: number;

  classesToday: number;

  eventsToday: number;

  announcements: number;

  completionRate: number;
}

export function calculateMetrics(
  data: SchoolDashboardData
): SchoolMetrics {
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const completedAssignments =
    data.assignments.filter(a => a.completed).length;

  const pendingAssignments =
    data.assignments.filter(a => !a.completed).length;

  const overdueAssignments =
    data.assignments.filter(
      a =>
        !a.completed &&
        a.due < now
    ).length;

  const classesToday =
    data.classes.filter(
      c =>
        c.start >= startOfToday &&
        c.start <= endOfToday
    ).length;

  const eventsToday =
    data.events.filter(
      e =>
        e.start >= startOfToday &&
        e.start <= endOfToday
    ).length;

  return {
    totalAssignments:
      data.assignments.length,

    completedAssignments,

    pendingAssignments,

    overdueAssignments,

    classesToday,

    eventsToday,

    announcements:
      data.announcements.length,

    completionRate:
      data.assignments.length === 0
        ? 100
        : Math.round(
            (completedAssignments /
              data.assignments.length) *
              100
          ),
  };
}