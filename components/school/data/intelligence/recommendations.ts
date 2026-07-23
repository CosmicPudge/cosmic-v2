import { SchoolDashboardData } from "../types";
import { calculateAssignmentRisk } from "./risk";

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
}

export function generateRecommendations(
  data: SchoolDashboardData
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  const risks = calculateAssignmentRisk(data.assignments);

  if (risks.length > 0) {
    const highestRisk = risks[0];

    recommendations.push({
      id: "highest-risk",
      title: `Work on ${highestRisk.assignment.title}`,
      description:
        "This assignment currently has the highest risk score.",
      priority:
        highestRisk.level === "critical" ||
        highestRisk.level === "high"
          ? "high"
          : "medium",
    });
  }

  if (data.classes.length > 0) {
    const nextClass = [...data.classes].sort(
      (a, b) => a.start.getTime() - b.start.getTime()
    )[0];

    recommendations.push({
      id: "next-class",
      title: `Prepare for ${nextClass.name}`,
      description:
        "Review notes before your next scheduled class.",
      priority: "medium",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: "all-clear",
      title: "You're all caught up",
      description:
        "No immediate actions are required.",
      priority: "low",
    });
  }

  return recommendations;
}