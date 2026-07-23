import {
  SchoolAssignment,
  SchoolClass,
} from "../types";

import { SchoolRisk } from "./risks";

export type RecommendationType =
  | "assignment"
  | "schedule"
  | "class"
  | "general";

export interface Recommendation {
  id: string;

  type: RecommendationType;

  priority: number;

  title: string;

  description: string;

  action?: string;
}

interface BuildRecommendationOptions {
  overdueAssignments: SchoolAssignment[];
  assignmentsDueToday: SchoolAssignment[];
  assignmentsDueTomorrow: SchoolAssignment[];
  nextAssignment?: SchoolAssignment;
  nextClass?: SchoolClass;
  risks: SchoolRisk[];
}

export function buildRecommendations(
  options: BuildRecommendationOptions
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  if (options.overdueAssignments.length > 0) {
    recommendations.push({
      id: "finish-overdue",

      type: "assignment",

      priority: 100,

      title: "Finish overdue work",

      description:
        "Overdue assignments should be your highest priority.",

      action: "Start Working",
    });
  }

  if (options.assignmentsDueToday.length > 0) {
    recommendations.push({
      id: "today",

      type: "assignment",

      priority: 90,

      title: "Complete today's assignments",

      description:
        `${options.assignmentsDueToday.length} assignment${
          options.assignmentsDueToday.length === 1 ? "" : "s"
        } due today.`,

      action: "View Assignments",
    });
  }

  if (
    options.nextClass &&
    options.overdueAssignments.length === 0
  ) {
    recommendations.push({
      id: "next-class",

      type: "class",

      priority: 70,

      title: `Prepare for ${options.nextClass.name}`,

      description:
        "Your next class is coming up.",

      action: "View Schedule",
    });
  }

  if (
    recommendations.length === 0
  ) {
    recommendations.push({
      id: "caught-up",

      type: "general",

      priority: 10,

      title: "You're all caught up",

      description:
        "Keep up the great work today.",
    });
  }

  return recommendations.sort(
    (a, b) => b.priority - a.priority
  );
}