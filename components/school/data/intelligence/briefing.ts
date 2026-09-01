import { IntelligenceContext } from "./context";
import { DailyBriefing } from "./types";
import { sameLocalDay } from "@/services/school/temporal";

export function generateDailyBriefing(
  context: IntelligenceContext
): DailyBriefing {
  const {
    data,
    workload,
    risks,
    recommendations,
  } = context;
  const snapshot = context.snapshot;
  const today = new Date(); const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const dayRequirements = (date: Date, category?: string) => (snapshot?.requirements ?? []).filter((item) => item.relevantDate && sameLocalDay(item.relevantDate, date) && (!category || item.category === category)).map((item) => item.value).slice(0, 5);
  const planItems = (date: Date) => (snapshot?.coursePlans ?? []).flatMap((plan) => [
    ...plan.exams.filter((item) => item.date && new Date(item.date).toDateString() === date.toDateString()).map((item) => `Exam: ${item.title}`),
    ...plan.majorAssignments.filter((item) => item.dueAt && new Date(item.dueAt).toDateString() === date.toDateString()).map((item) => `Due: ${item.title}`),
  ]);
  const weekday = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][today.getDay()];
  const officeHours = (snapshot?.coursePlans ?? []).flatMap((plan) => plan.officeHours.filter((item) => Array.isArray(item.daysOfWeek) && item.daysOfWeek.includes(weekday)).map((item) => String(item.value ?? `Office hours ${item.startTime ?? ""}-${item.endTime ?? ""}`))).slice(0, 5);

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
  school: {
    today: [...data.assignments.filter((item) => item.due.toDateString() === today.toDateString()).map((item) => item.title), ...data.events.filter((item) => item.start.toDateString() === today.toDateString()).map((item) => item.title), ...planItems(today)].slice(0, 8),
    tomorrow: [...data.events.filter((item) => item.start.toDateString() === tomorrow.toDateString()).map((item) => item.title), ...planItems(tomorrow)].slice(0, 5),
    bring: dayRequirements(today, "bring"),
    wear: dayRequirements(today, "wear"),
    prepare: dayRequirements(tomorrow, "prepare"),
    officeHours,
    suggestedReview: (snapshot?.topics ?? []).slice(0, 3).map((item) => ({ value: item.value, source: "Study notes" })),
  },
};
}
