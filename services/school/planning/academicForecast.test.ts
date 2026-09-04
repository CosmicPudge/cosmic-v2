import assert from "node:assert/strict";
import test from "node:test";
import type { SchoolSnapshot } from "@/services/school/domain";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import { buildAcademicForecast } from "./academicForecast";
import type { ProactivePlan, RecommendedWorkBlock } from "./academicPlanner";
import { safeSchoolDate } from "../hydration";

const now = new Date("2026-09-14T12:00:00");
const monday = new Date("2026-09-14T00:00:00");

function assignment(id: string, dueAt?: string, extra: Partial<SchoolPlanningAssignment> = {}): SchoolPlanningAssignment {
  return { id, accountId: "test", title: id, sourceType: "manual", completionStatus: "upcoming", planningStatus: "not_started", priority: "normal", createdAt: now, updatedAt: now, ...(dueAt ? { dueAt: new Date(dueAt) } : {}), ...extra };
}

function snapshot(assignments: SchoolPlanningAssignment[], events: SchoolSnapshot["events"] = []): SchoolSnapshot {
  return { courses: [], assignments: [], events, actionItems: [], facts: [], notes: [], topics: [], requirements: [], importantFacts: [], sources: [], updatedAt: now.toISOString(), planningAssignments: assignments };
}

function plan(plannedByWeek: number[], availableByWeek = plannedByWeek.map(() => 600), blocks: RecommendedWorkBlock[] = []): ProactivePlan {
  const allBlocks = [...blocks];
  plannedByWeek.forEach((planned, weekIndex) => {
    const explicit = blocks.filter((block) => block.date >= new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + weekIndex * 7) && block.date < new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + (weekIndex + 1) * 7)).reduce((total, block) => total + block.minutes, 0);
    if (planned > explicit) allBlocks.push({ assignmentId: `planned-${weekIndex}`, date: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + weekIndex * 7 + 1), minutes: planned - explicit, title: `Planned work ${weekIndex}`, reason: "fixture" });
  });
  const dailyCapacity = plannedByWeek.flatMap((_, weekIndex) => Array.from({ length: 7 }, (_, dayIndex) => ({ date: new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + weekIndex * 7 + dayIndex), capacityMinutes: Math.round(availableByWeek[weekIndex] / 7), scheduledMinutes: 0, classCount: 0 })));
  const plannedAssignments = [...new Set(allBlocks.map((block) => block.assignmentId))].map((assignmentId) => { const itemBlocks = allBlocks.filter((block) => block.assignmentId === assignmentId); return { assignmentId, recommendedWorkDate: itemBlocks[0].date, workBlocks: itemBlocks, estimatedMinutes: itemBlocks.reduce((total, block) => total + block.minutes, 0), usedDefaultEstimate: false, urgency: "LATER" as const, reason: itemBlocks[0].reason, workType: itemBlocks[0].workType }; });
  return { generatedAt: now, horizonStart: monday, horizonEnd: new Date("2026-10-25T23:59:59"), dailyCapacity, assignments: plannedAssignments, workBlocks: allBlocks, shouldNotifyToday: false };
}

function weekForecast(planned: number, available: number, blocks: RecommendedWorkBlock[] = [], assignments: SchoolPlanningAssignment[] = []) {
  return buildAcademicForecast(snapshot(assignments), now, plan([planned], [available], blocks)).weeks[0];
}

test("manageable weeks stay low risk", () => {
  const result = weekForecast(180, 600, [], [assignment("Reading", "2026-09-17T23:59:00")]);
  assert.equal(result.riskLevel, "LOW");
  assert.equal(result.reasons.length, 0);
});

test("high utilization explains capacity pressure", () => {
  const result = weekForecast(550, 600);
  assert.equal(result.riskLevel, "HIGH");
  assert.match(result.reasons.join(" "), /capacity/);
});

test("over-capacity weeks become critical and explain the excess", () => {
  const result = weekForecast(750, 600);
  assert.equal(result.riskLevel, "CRITICAL");
  assert.match(result.reasons.join(" "), /exceeds available capacity/);
});

test("exam and project deadlines collide only from explicit items", () => {
  const events = [{ id: "chem-exam", title: "CHEM Exam 2", source: "canvas-calendar" as const, type: "exam" as const, start: new Date("2026-09-16T10:00:00"), end: new Date("2026-09-16T12:00:00") }];
  const result = weekForecast(550, 600, [], [assignment("ENGR Design Project", "2026-09-18T23:59:00", { estimatedMinutes: 240 })]);
  const withEvent = buildAcademicForecast(snapshot([assignment("ENGR Design Project", "2026-09-18T23:59:00", { estimatedMinutes: 240 })], events), now, plan([550], [600]));
  assert.equal(result.riskLevel, "HIGH");
  assert.equal(withEvent.weeks[0].collisions.length, 1);
  assert.match(withEvent.weeks[0].reasons.join(" "), /CHEM Exam 2/);
  assert.match(withEvent.weeks[0].reasons.join(" "), /ENGR Design Project/);
});

test("two exams within the collision window are reported", () => {
  const events = [
    { id: "exam-1", title: "CHEM Exam 2", source: "canvas-calendar" as const, type: "exam" as const, start: new Date("2026-09-16T10:00:00"), end: new Date("2026-09-16T12:00:00") },
    { id: "exam-2", title: "MATH Exam 1", source: "canvas-calendar" as const, type: "exam" as const, start: new Date("2026-09-18T10:00:00"), end: new Date("2026-09-18T12:00:00") },
  ];
  const result = buildAcademicForecast(snapshot([], events), now, plan([540], [600]));
  assert.equal(result.weeks[0].collisions.length, 1);
  assert.match(result.weeks[0].collisions[0].reason, /exam \+ exam/);
});

test("tiny deadline workload does not create a heavy warning", () => {
  const items = [assignment("A", "2026-09-15T12:00:00", { estimatedMinutes: 10 }), assignment("B", "2026-09-16T12:00:00", { estimatedMinutes: 10 }), assignment("C", "2026-09-17T12:00:00", { estimatedMinutes: 10 })];
  const result = weekForecast(30, 600, [], items);
  assert.notEqual(result.riskLevel, "HIGH");
  assert.notEqual(result.riskLevel, "CRITICAL");
});

test("pull-forward opportunities reduce later load without mutating the plan", () => {
  const item = assignment("ENGR Design Project", "2026-09-25T23:59:00", { estimatedMinutes: 240 });
  const blocks = [{ assignmentId: item.id, date: new Date("2026-09-23T12:00:00"), minutes: 240, title: item.title, workType: "project" as const, reason: "planned" }];
  const result = buildAcademicForecast(snapshot([item]), now, plan([300, 750], [600, 600], blocks));
  const opportunity = result.weeks[1].opportunities[0];
  assert.ok(opportunity);
  assert.equal(opportunity.minutes, 45);
  assert.equal(opportunity.assignmentId, item.id);
  assert.equal(result.weeks[0].plannedMinutes, 300);
  assert.equal(result.weeks[1].plannedMinutes, 750);
});

test("near-capacity earlier weeks do not receive get-ahead work", () => {
  const item = assignment("ENGR Design Project", "2026-09-25T23:59:00", { estimatedMinutes: 240 });
  const blocks = [{ assignmentId: item.id, date: new Date("2026-09-23T12:00:00"), minutes: 240, title: item.title, workType: "project" as const, reason: "planned" }];
  const result = buildAcademicForecast(snapshot([item]), now, plan([570, 750], [600, 600], blocks));
  assert.equal(result.weeks[0].opportunities.length, 0);
  assert.equal(result.weeks[1].opportunities.length, 0);
});

test("fixed exam events are never proposed for pull-forward", () => {
  const events = [{ id: "exam-1", title: "CHEM Exam 2", source: "canvas-calendar" as const, type: "exam" as const, start: new Date("2026-09-23T10:00:00"), end: new Date("2026-09-23T12:00:00") }];
  const result = buildAcademicForecast(snapshot([], events), now, plan([300, 750], [600, 600]));
  assert.equal(result.weeks.flatMap((week) => week.opportunities).length, 0);
});

test("completed work disappears when the forecast is recomputed", () => {
  const item = assignment("Project", "2026-09-25T23:59:00", { estimatedMinutes: 240 });
  const active = buildAcademicForecast(snapshot([item]), now, plan([300, 750], [600, 600], [{ assignmentId: item.id, date: new Date("2026-09-23T12:00:00"), minutes: 240, title: item.title, workType: "project", reason: "planned" }]));
  const completed = buildAcademicForecast(snapshot([{ ...item, completionStatus: "completed" }]), now);
  assert.equal(active.weeks[1].plannedMinutes, 750);
  assert.equal(completed.weeks[1].plannedMinutes, 0);
  assert.equal(completed.summary.getAheadOpportunityCount, 0);
});

test("invalid due dates create no forecast deadline or collision", () => {
  const item = { ...assignment("Malformed", undefined), dueAt: "not-a-date" } as unknown as SchoolPlanningAssignment;
  const result = buildAcademicForecast(snapshot([item]), now);
  assert.doesNotThrow(() => buildAcademicForecast(snapshot([item]), now));
  assert.equal(result.weeks.every((week) => week.deadlineCount === 0 && week.collisions.length === 0), true);
});

test("date-only deadlines remain on their local academic day", () => {
  const item = { ...assignment("Reflection"), dueAt: safeSchoolDate("2026-09-08") };
  const result = buildAcademicForecast(snapshot([item]), new Date("2026-09-06T12:00:00"));
  assert.equal(result.weeks[1].deadlineCount, 1);
  assert.equal(result.weeks[1].weekStart.getDate(), 7);
});

test("forecast output is deterministic", () => {
  const items = [assignment("Project", "2026-09-25T23:59:00", { estimatedMinutes: 240 }), assignment("Exam prep", "2026-09-23T23:59:00", { estimatedMinutes: 90 })];
  const first = buildAcademicForecast(snapshot(items), now);
  const second = buildAcademicForecast(snapshot(items), now);
  assert.deepEqual(JSON.parse(JSON.stringify(first)), JSON.parse(JSON.stringify(second)));
});

test("planned project blocks are not double-counted in the deadline week", () => {
  const item = assignment("Project", "2026-09-25T23:59:00", { estimatedMinutes: 240 });
  const blocks = [1, 2, 3, 4].map((day) => ({ assignmentId: item.id, date: new Date(2026, 8, 14 + day), minutes: 60, title: item.title, workType: "project" as const, reason: "planned" }));
  const result = buildAcademicForecast(snapshot([item]), now, plan([0, 0], [600, 600], blocks));
  assert.equal(result.weeks[0].plannedMinutes, 240);
  assert.equal(result.weeks[1].plannedMinutes, 0);
  assert.equal(result.weeks[1].deadlineMinutes, 0);
  assert.equal(result.weeks[1].deadlineCount, 1);
});

test("zero capacity remains finite and safe", () => {
  const result = weekForecast(30, 0);
  assert.equal(Number.isFinite(result.utilization), true);
  assert.equal(result.riskLevel, "CRITICAL");
});
