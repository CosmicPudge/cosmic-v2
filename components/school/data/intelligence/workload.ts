import { SchoolDashboardData } from "../types";

export type WorkloadLevel =
  | "light"
  | "moderate"
  | "heavy"
  | "critical";

export function calculateWorkload(
  data: SchoolDashboardData
): WorkloadLevel {
  let score = 0;

  // Pending assignments
  score +=
    data.assignments.filter(
      (assignment) => !assignment.completed
    ).length * 10;

  // Upcoming events
  score += data.events.length * 5;

  // Classes
  score += data.classes.length * 3;

  if (score >= 75) return "critical";
  if (score >= 45) return "heavy";
  if (score >= 20) return "moderate";

  return "light";
}