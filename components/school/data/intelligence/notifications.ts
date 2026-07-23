import { IntelligenceContext } from "./context";

export interface SchoolNotification {
  id: string;

  priority: "low" | "medium" | "high" | "critical";

  title: string;

  description: string;

  type:
    | "assignment"
    | "exam"
    | "quiz"
    | "class"
    | "announcement"
    | "general";
}

export function buildNotifications(
  context: IntelligenceContext
): SchoolNotification[] {
  const notifications: SchoolNotification[] = [];

  const highestRisk = context.risks[0];

  if (highestRisk) {
    notifications.push({
      id: highestRisk.assignment.id,

      priority:
        highestRisk.level === "critical"
          ? "critical"
          : highestRisk.level === "high"
          ? "high"
          : highestRisk.level === "medium"
          ? "medium"
          : "low",

      title: highestRisk.assignment.title,

      description:
        "This assignment should be your next priority.",

      type: "assignment",
    });
  }

  const overdueAssignments =
    context.data.assignments.filter(
      (assignment) =>
        !assignment.completed &&
        assignment.due < new Date()
    ).length;

  if (overdueAssignments > 0) {
    notifications.push({
      id: "overdue",

      priority: "critical",

      title: "Overdue Assignments",

      description: `${overdueAssignments} assignment${
        overdueAssignments === 1 ? "" : "s"
      } overdue.`,

      type: "general",
    });
  }

  return notifications;
}