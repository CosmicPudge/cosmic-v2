import { SchoolAssignment } from "../types";
import { IntelligenceContext } from "./context";
import { AssignmentRisk } from "./risk";

export interface PlannedTask {
  assignmentId: string;

  title: string;

  course?: string;

  reason: string;

  estimatedMinutes: number;

  shouldStartNow: boolean;

  riskScore: number;

  priority: "Low" | "Medium" | "High";

  dueLabel: string;
}

export interface DailyPlan {
  nextTask?: PlannedTask;

  todayGoal: string;

  afterNext?: string;

  confidence: number;
}

function estimateMinutes(
  priority: SchoolAssignment["priority"]
) {
  switch (priority) {
    case "high":
      return 180;

    case "medium":
      return 90;

    default:
      return 45;
  }
}

function buildReason(risk: AssignmentRisk) {
  switch (risk.level) {
    case "critical":
      return "This assignment needs immediate attention.";

    case "high":
      return "This is your highest priority assignment.";

    case "medium":
      return "Working on this today will keep you on schedule.";

    case "low":
    default:
      return "You have time, but starting early is recommended.";
  }
}

function formatDueLabel(due: Date) {
  const now = new Date();

  const DAY = 1000 * 60 * 60 * 24;

  const days = Math.floor(
    (due.getTime() - now.getTime()) / DAY
  );

  if (days <= 0) return "Due Today";

  if (days === 1) return "Due Tomorrow";

  return `Due in ${days} days`;
}

export function buildDailyPlan(
  context: IntelligenceContext
): DailyPlan {
  const { risks } = context;

  if (risks.length === 0) {
    return {
      todayGoal: "You're all caught up. Great job!",
      confidence: 100,
    };
  }

  const current = risks[0];
  const next = risks[1];

  return {
    nextTask: {
      assignmentId: current.assignment.id,

      title: current.assignment.title,

      course: current.assignment.course,

      reason: buildReason(current),

      estimatedMinutes: estimateMinutes(
        current.assignment.priority
      ),

      shouldStartNow: current.level !== "low",

      riskScore: current.score,

      priority:
        current.assignment.priority === "high"
          ? "High"
          : current.assignment.priority === "medium"
          ? "Medium"
          : "Low",

      dueLabel: formatDueLabel(
        current.assignment.due
      ),
    },

    todayGoal: `Complete ${current.assignment.title}`,

    afterNext: next?.assignment.title,

    confidence: Math.min(100, current.score),
  };
}