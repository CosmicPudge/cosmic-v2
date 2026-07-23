import { SchoolAssignment } from "../types";

export interface AssignmentPriority {
  assignmentId: string;

  score: number;

  urgency: number;

  workload: number;

  impact: number;

  reason: string;
}

function hoursUntilDue(date: Date): number {
  return (date.getTime() - Date.now()) / (1000 * 60 * 60);
}

export function buildPriorities(
  assignments: SchoolAssignment[]
): AssignmentPriority[] {
  return assignments
    .filter((assignment) => !assignment.completed)
    .map((assignment) => {
      let urgency = 0;

      const hours = hoursUntilDue(assignment.due);

      if (hours <= 0) {
        urgency = 100;
      } else if (hours <= 24) {
        urgency = 90;
      } else if (hours <= 72) {
        urgency = 70;
      } else if (hours <= 168) {
        urgency = 50;
      } else {
        urgency = 20;
      }

      let workload = 0;

      switch (assignment.priority) {
        case "high":
          workload = 100;
          break;

        case "medium":
          workload = 60;
          break;

        case "low":
          workload = 30;
          break;
      }

      // For now we estimate impact from priority.
      // Later this will come from Canvas points/grade weight.
      const impact = workload;

      const score = Math.round(
        urgency * 0.5 +
        workload * 0.25 +
        impact * 0.25
      );

      return {
        assignmentId: assignment.id,

        score,

        urgency,

        workload,

        impact,

        reason:
          hours <= 24
            ? "Due within 24 hours."
            : "Based on workload and due date.",
      };
    })
    .sort((a, b) => b.score - a.score);
}