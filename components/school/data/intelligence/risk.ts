import { SchoolAssignment } from "../types";

export interface AssignmentRisk {
  assignment: SchoolAssignment;
  score: number;
  level: "low" | "medium" | "high" | "critical";
}

const DAY = 1000 * 60 * 60 * 24;

export function calculateAssignmentRisk(
  assignments: SchoolAssignment[]
): AssignmentRisk[] {
  const now = new Date();

  return assignments
    .filter((assignment) => !assignment.completed)
    .map((assignment) => {
      let score = 0;

      const days =
        (assignment.due.getTime() - now.getTime()) / DAY;

      if (days <= 0) {
        score += 100;
      } else if (days <= 1) {
        score += 80;
      } else if (days <= 3) {
        score += 60;
      } else if (days <= 7) {
        score += 35;
      } else {
        score += 15;
      }

      // Bonus score based on assignment priority
      switch (assignment.priority) {
        case "high":
          score += 20;
          break;
        case "medium":
          score += 10;
          break;
        case "low":
          break;
      }

      const level: AssignmentRisk["level"] =
        score >= 90
          ? "critical"
          : score >= 70
          ? "high"
          : score >= 40
          ? "medium"
          : "low";

      return {
        assignment,
        score,
        level,
      };
    })
    .sort((a, b) => b.score - a.score);
}