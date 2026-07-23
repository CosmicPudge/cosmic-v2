import { IntelligenceContext } from "./context";

export interface AcademicPerformance {
  completedAssignments: number;

  remainingAssignments: number;

  overdueAssignments: number;

  completionRate: number;

  status:
    | "excellent"
    | "good"
    | "warning"
    | "critical";

  strongestArea: string;

  needsAttention?: string;
}

export function buildPerformance(
  context: IntelligenceContext
): AcademicPerformance {
  const assignments = context.data.assignments;

  const completedAssignments =
    assignments.filter((a) => a.completed).length;

  const remainingAssignments =
    assignments.length - completedAssignments;

  const now = new Date();

  const overdueAssignments =
    assignments.filter(
      (a) => !a.completed && a.due < now
    ).length;

  const completionRate =
    assignments.length === 0
      ? 100
      : Math.round(
          (completedAssignments /
            assignments.length) *
            100
        );

  let status: AcademicPerformance["status"];

  if (overdueAssignments > 2) {
    status = "critical";
  } else if (overdueAssignments > 0) {
    status = "warning";
  } else if (completionRate >= 90) {
    status = "excellent";
  } else {
    status = "good";
  }

  const highestRisk = context.risks[0];

  return {
    completedAssignments,

    remainingAssignments,

    overdueAssignments,

    completionRate,

    status,

    strongestArea:
      completionRate >= 90
        ? "Assignment completion"
        : "Course participation",

    needsAttention:
      highestRisk?.assignment.course,
  };
}