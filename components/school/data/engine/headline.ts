import { Mission } from "../types";
import { SchoolIntelligence } from "./intelligence";

export function buildHeadline(
  intelligence: SchoolIntelligence,
  mission: Mission
): string {
  if (intelligence.overdueAssignments.length > 0) {
    return "You have overdue work that needs attention.";
  }

  if (intelligence.assignmentsDueToday.length > 0) {
    return "Today's assignments should be your main focus.";
  }

  if (intelligence.nextClass) {
    return `Next class: ${intelligence.nextClass.name}`;
  }

  if (mission.priority === "low") {
    return "You're all caught up.";
  }

  return mission.subtitle;
}