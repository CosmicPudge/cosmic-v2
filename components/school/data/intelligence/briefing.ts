import { IntelligenceContext } from "./context";
import { DailyBriefing } from "./types";

export function generateDailyBriefing(
  context: IntelligenceContext
): DailyBriefing {
  const {
    data,
    workload,
    risks,
    recommendations,
  } = context;

  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 18
      ? "Good afternoon"
      : "Good evening";

  let headline = "Everything looks good.";

  if (risks.length > 0) {
    headline = `${risks[0].assignment.title} is your highest priority today.`;
  }

  const classCount = data.classes.length;
  const assignmentCount = data.assignments.filter(
    (a) => !a.completed
  ).length;
  const eventCount = data.events.length;

  const summary = [
    `${classCount} class${classCount === 1 ? "" : "es"}`,
    `${assignmentCount} assignment${
      assignmentCount === 1 ? "" : "s"
    }`,
    `${eventCount} event${eventCount === 1 ? "" : "s"}`,
  ].join(" • ");

  return {
  greeting,

  headline,

  summary,

  workload,

  recommendations: recommendations.map(r => r.title),

  risks: risks.slice(0, 3).map(r => r.assignment.title),

  accomplishments: [],

  assignmentCompletion:
    context.metrics.completionRate,

  completedAssignments:
    context.metrics.completedAssignments,

  pendingAssignments:
    context.metrics.pendingAssignments,

  overdueAssignments:
    context.metrics.overdueAssignments,

  classesToday:
    context.metrics.classesToday,

  eventsToday:
    context.metrics.eventsToday,

  announcements:
    context.metrics.announcements,

  estimatedStudyMinutes:
    context.data.assignments
      .filter(a => !a.completed)
      .reduce((total, assignment) => {
        switch (assignment.priority) {
          case "high":
            return total + 180;

          case "medium":
            return total + 90;

          default:
            return total + 45;
        }
      }, 0),

  currentWeek:
    context.data.semester.week,

  notificationCount:
  Math.min(2, risks.length) +
  (context.metrics.overdueAssignments > 0 ? 1 : 0),
};
}