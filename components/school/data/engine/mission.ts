import { Mission } from "../types";
import { AssignmentPriority } from "./priorities";
import { SchoolIntelligence } from "./intelligence";

export function buildMission(
  intelligence: SchoolIntelligence,
  priorities: AssignmentPriority[]
): Mission {
  // Highest priority assignment
  const topPriority = priorities[0];

  if (topPriority && intelligence.nextAssignment) {
    return {
      title: `Complete ${intelligence.nextAssignment.title}`,

      subtitle: topPriority.reason,

      priority:
        topPriority.score >= 85
          ? "high"
          : topPriority.score >= 60
          ? "medium"
          : "low",
    };
  }

  // Upcoming class
  if (intelligence.nextClass) {
    return {
      title: `Attend ${intelligence.nextClass.name}`,

      subtitle: "Your next scheduled class.",

      priority: "medium",
    };
  }

  // Tomorrow's work
  if (intelligence.assignmentsDueTomorrow.length > 0) {
    return {
      title: "Prepare for tomorrow",

      subtitle:
        `${intelligence.assignmentsDueTomorrow.length} assignment${
          intelligence.assignmentsDueTomorrow.length === 1
            ? ""
            : "s"
        } due tomorrow.`,

      priority: "low",
    };
  }

  // Finished
  return {
    title: "Everything is caught up.",

    subtitle: "Enjoy your day.",

    priority: "low",
  };
}