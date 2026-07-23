import {
  SchoolAssignment,
  SchoolClass,
} from "../types";

export type RiskSeverity = "low" | "medium" | "high";

export interface SchoolRisk {
  id: string;

  severity: RiskSeverity;

  title: string;

  description: string;

  recommendation: string;
}

interface BuildRiskOptions {
  overdueAssignments: SchoolAssignment[];
  assignmentsDueToday: SchoolAssignment[];
  assignmentsDueTomorrow: SchoolAssignment[];
  nextAssignment?: SchoolAssignment;
  nextClass?: SchoolClass;
}

export function buildRisks(
  options: BuildRiskOptions
): SchoolRisk[] {
  const risks: SchoolRisk[] = [];

  if (options.overdueAssignments.length > 0) {
    risks.push({
      id: "overdue",

      severity: "high",

      title: "Overdue Assignments",

      description: `${options.overdueAssignments.length} assignment${
        options.overdueAssignments.length === 1 ? "" : "s"
      } overdue.`,

      recommendation:
        "Complete your overdue assignments as soon as possible.",
    });
  }

  if (options.assignmentsDueToday.length >= 3) {
    risks.push({
      id: "busy-day",

      severity: "medium",

      title: "Heavy Workload",

      description:
        "Several assignments are due today.",

      recommendation:
        "Finish the highest priority work first.",
    });
  }

  if (
    options.assignmentsDueTomorrow.length >= 3
  ) {
    risks.push({
      id: "tomorrow",

      severity: "low",

      title: "Busy Tomorrow",

      description:
        "Tomorrow already has several deadlines.",

      recommendation:
        "Getting ahead tonight will reduce tomorrow's workload.",
    });
  }

  return risks;
}