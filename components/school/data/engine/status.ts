import { SchoolIntelligence } from "./intelligence";

export function buildStatus(
  intelligence: SchoolIntelligence
): string {
  if (intelligence.overdueAssignments.length > 0) {
    return "Needs Attention";
  }

  if (intelligence.assignmentsDueToday.length > 0) {
    return "Busy Day";
  }

  if (intelligence.today.workload === "heavy") {
    return "Heavy Workload";
  }

  if (intelligence.today.workload === "moderate") {
    return "On Track";
  }

  return "Caught Up";
}