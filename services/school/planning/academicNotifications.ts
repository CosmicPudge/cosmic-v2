import type { CosmicNotification } from "@/core/contracts/Notifications";
import type { SchoolSnapshot } from "@/services/school/domain";
import { isAssignmentActiveForPlanning, isAssignmentOverdue } from "../planning";
import { buildProactivePlan, type ProactivePlan } from "./academicPlanner";

export const SCHOOL_NOTIFICATION_BUDGET = 4;
export type SchoolNotificationType = "WORK_TODAY" | "CONTINUE_TODAY" | "FINISH_TODAY" | "DUE_TOMORROW" | "DUE_TODAY" | "OVERDUE" | "SCHEDULE_CHANGED" | "NEW_ASSIGNMENT" | "CANVAS_SYNC_PROBLEM";

const localDay = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
const nextDay = (date: Date) => { const result = new Date(date); result.setDate(result.getDate() + 1); return result; };
const importance = (type: SchoolNotificationType): CosmicNotification["importance"] => type === "OVERDUE" || type === "DUE_TODAY" ? "urgent" : type === "FINISH_TODAY" || type === "CONTINUE_TODAY" ? "important" : "normal";
const rank = (type: SchoolNotificationType) => ({ OVERDUE: 0, DUE_TODAY: 1, FINISH_TODAY: 2, CONTINUE_TODAY: 3, WORK_TODAY: 4, DUE_TOMORROW: 5, NEW_ASSIGNMENT: 6, SCHEDULE_CHANGED: 7, CANVAS_SYNC_PROBLEM: 8 } satisfies Record<SchoolNotificationType, number>)[type];

function notification(snapshot: SchoolSnapshot, type: SchoolNotificationType, assignmentId: string | undefined, title: string, body: string, now: Date, due?: Date): CosmicNotification {
  const day = localDay(now);
  const href = assignmentId && !assignmentId.startsWith("academic-event:") ? `/school/assignments/${encodeURIComponent(assignmentId)}` : "/school";
  return { id: `school:${assignmentId ?? "system"}:${type}:${day}`, source: "school", title, body, timestamp: now.toISOString(), read: false, importance: importance(type), category: type, href, expiresAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString(), ...(due ? { icon: "assignment", accent: "amber" } : {}) };
}

/** Select bounded, stable School notifications from the derived plan. */
export function buildAcademicNotifications(snapshot: SchoolSnapshot, now = new Date(), plan = buildProactivePlan(snapshot, now)): CosmicNotification[] {
  const assignments = new Map((snapshot.planningAssignments ?? []).map((item) => [item.id, item]));
  const candidates: Array<{ type: SchoolNotificationType; itemId?: string; title: string; body: string; due?: Date }> = [];
  for (const item of assignments.values()) {
    if (!isAssignmentActiveForPlanning(item)) continue;
    const itemPlan = plan.assignments.find((entry) => entry.assignmentId === item.id);
    const todays = itemPlan?.workBlocks.filter((block) => localDay(block.date) === localDay(now)) ?? [];
    if (todays.length) {
      const finalBlock = itemPlan?.workBlocks.at(-1) === todays.at(-1);
      const type: SchoolNotificationType = finalBlock ? "FINISH_TODAY" : item.planningStatus === "in_progress" || item.planningStatus === "planned" ? "CONTINUE_TODAY" : "WORK_TODAY";
      candidates.push({ type, itemId: item.id, title: `${finalBlock ? "Finish" : type === "CONTINUE_TODAY" ? "Continue" : "Work on"} ${item.title} today`, body: `${todays.reduce((sum, block) => sum + block.minutes, 0)} min${item.dueAt ? ` · Due ${item.dueAt.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}` : ""}`, due: item.dueAt });
      continue;
    }
    if (isAssignmentOverdue(item, now)) candidates.push({ type: "OVERDUE", itemId: item.id, title: `Overdue: ${item.title}`, body: "Work on it today.", due: item.dueAt });
    else if (item.dueAt && localDay(item.dueAt) === localDay(nextDay(now))) candidates.push({ type: "DUE_TOMORROW", itemId: item.id, title: `${item.title} is due tomorrow`, body: "Make time to finish before the deadline.", due: item.dueAt });
    else if (item.dueAt && localDay(item.dueAt) === localDay(now)) candidates.push({ type: "DUE_TODAY", itemId: item.id, title: `${item.title} is due today`, body: "This assignment is still incomplete.", due: item.dueAt });
  }
  for (const itemPlan of plan.assignments.filter((entry) => (entry.workType === "exam" || entry.workType === "quiz") && entry.workBlocks.some((block) => localDay(block.date) === localDay(now)))) {
    const blocks = itemPlan.workBlocks.filter((block) => localDay(block.date) === localDay(now));
    candidates.push({ type: blocks.at(-1) === itemPlan.workBlocks.at(-1) ? "FINISH_TODAY" : "WORK_TODAY", itemId: itemPlan.assignmentId, title: `${blocks.at(-1) === itemPlan.workBlocks.at(-1) ? "Final review for" : "Study for"} ${itemPlan.workBlocks[0].title ?? itemPlan.assignmentId} today`, body: `${blocks.reduce((sum, block) => sum + block.minutes, 0)} min · ${itemPlan.workType === "exam" ? "Exam" : "Quiz"} preparation` });
  }
  return candidates.sort((left, right) => rank(left.type) - rank(right.type) || left.title.localeCompare(right.title)).slice(0, SCHOOL_NOTIFICATION_BUDGET).map((item) => notification(snapshot, item.type, item.itemId, item.title, item.body, now, item.due));
}

export interface AcademicBriefing {
  title: "TODAY AT SCHOOL";
  greeting: string;
  classesToday: number;
  plannedWorkBlocks: number;
  dueTomorrow: number;
  plannedMinutes: number;
  todayWork: Array<{ assignmentId: string; title: string; minutes: number }>;
  nextClass?: { title: string; start: Date };
}

export function buildAcademicBriefing(snapshot: SchoolSnapshot, now = new Date(), plan: ProactivePlan = buildProactivePlan(snapshot, now)): AcademicBriefing {
  const todayBlocks = plan.workBlocks.filter((block) => localDay(block.date) === localDay(now));
  const assignments = new Map((snapshot.planningAssignments ?? []).map((item) => [item.id, item]));
  const todayWork = [...new Map(todayBlocks.map((block) => [block.assignmentId, block])).values()].map((block) => ({ assignmentId: block.assignmentId, title: assignments.get(block.assignmentId)?.title ?? block.assignmentId, minutes: todayBlocks.filter((candidate) => candidate.assignmentId === block.assignmentId).reduce((sum, candidate) => sum + candidate.minutes, 0) }));
  const classes = snapshot.events.filter((event) => event.type === "class" && localDay(event.start) === localDay(now)).sort((a, b) => a.start.getTime() - b.start.getTime());
  const tomorrow = localDay(nextDay(now));
  return { title: "TODAY AT SCHOOL", greeting: now.getHours() < 12 ? "GOOD MORNING" : now.getHours() < 18 ? "GOOD AFTERNOON" : "GOOD EVENING", classesToday: classes.length, plannedWorkBlocks: todayBlocks.length, dueTomorrow: [...assignments.values()].filter((item) => isAssignmentActiveForPlanning(item) && item.dueAt && localDay(item.dueAt) === tomorrow).length, plannedMinutes: todayBlocks.reduce((sum, block) => sum + block.minutes, 0), todayWork, ...(classes[0] ? { nextClass: { title: classes[0].title, start: classes[0].start } } : {}) };
}
