import { Focus, SchoolAssignment } from "../types";
import { AssignmentPriority } from "./priorities";

export function buildFocus(
  assignments: SchoolAssignment[],
  priorities: AssignmentPriority[]
): Focus {
  const top = priorities[0];

  if (!top) {
    return {
      title: "Everything is complete",
      priority: "low",
      progress: 100,
      estimatedMinutes: 0,
      reason: "No outstanding assignments.",
    };
  }

  const assignment = assignments.find(
    (a) => a.id === top.assignmentId
  );

  if (!assignment) {
    return {
      title: "No active focus",
      priority: "low",
      progress: 100,
      estimatedMinutes: 0,
      reason: "No assignment found.",
    };
  }

  return {
    title: assignment.title,
    course: assignment.course,
    priority:
      top.score >= 85
        ? "high"
        : top.score >= 60
        ? "medium"
        : "low",
    progress: Math.max(0, 100 - top.score),
    estimatedMinutes: 60,
    reason: top.reason,
  };
}