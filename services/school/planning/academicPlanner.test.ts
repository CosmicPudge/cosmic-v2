import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { buildAcademicRecommendations, buildAcademicState, buildProactivePlan } from "./academicPlanner.ts";
import { hydrateSchoolPlanningAssignments } from "../hydration";
import type { SchoolSnapshot } from "@/services/school/domain";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";

const now = new Date("2026-09-10T12:00:00.000Z");
function assignment(id: string, dueAt: string | undefined, extra: Partial<SchoolPlanningAssignment> = {}): SchoolPlanningAssignment { return { id, accountId: "test", title: id, sourceType: "manual", completionStatus: "upcoming", planningStatus: "not_started", priority: "normal", createdAt: now, updatedAt: now, ...(dueAt ? { dueAt: new Date(dueAt) } : {}), ...extra }; }
function snapshot(assignments: SchoolPlanningAssignment[] = []): SchoolSnapshot { return { courses: [], assignments: [], events: [], actionItems: [], facts: [], notes: [], topics: [], requirements: [], importantFacts: [], sources: [], updatedAt: now.toISOString(), planningAssignments: assignments }; }

test("overdue beats future and completed work is excluded", () => { const state = buildAcademicState(snapshot([assignment("future", "2026-09-17T12:00:00Z"), assignment("overdue", "2026-09-09T12:00:00Z"), assignment("done", "2026-09-09T12:00:00Z", { completionStatus: "completed" })]), now); const recommendations = buildAcademicRecommendations(state); assert.equal(recommendations[0].assignmentId, "overdue"); assert.equal(recommendations.some((item) => item.assignmentId === "done"), false); });
test("known short task is a quick win; unknown duration is not", () => { const recommendations = buildAcademicRecommendations(buildAcademicState(snapshot([assignment("short", "2026-09-17T12:00:00Z", { estimatedMinutes: 30 }), assignment("unknown", "2026-09-17T12:00:00Z")]), now)); const short = recommendations.find((item) => item.assignmentId === "short"); const unknown = recommendations.find((item) => item.assignmentId === "unknown"); assert.equal(short?.reasonCodes.includes("SHORT_TASK"), true); assert.equal(unknown?.reasonCodes.includes("SHORT_TASK"), false); });
test("empty snapshot is safe", () => { const result = buildAcademicRecommendations(buildAcademicState(snapshot(), now)); assert.deepEqual(result, []); });
test("proactive plan starts substantial work before its due date and preserves dueAt", () => {
  const dueAt = new Date("2026-09-14T23:59:00Z");
  const item = assignment("project", dueAt.toISOString(), { estimatedMinutes: 240 });
  const plan = buildProactivePlan(snapshot([item]), new Date("2026-09-10T12:00:00Z"));
  const result = plan.assignments.find((entry) => entry.assignmentId === item.id);
  assert.ok(result);
  assert.ok(result.recommendedWorkDate < dueAt);
  assert.ok(result.workBlocks.length >= 3);
  assert.equal(item.dueAt?.getTime(), dueAt.getTime());
});
test("plans meaningful work before the September 8 deadline", () => {
  const today = new Date("2026-09-06T12:00:00.000Z");
  const dueAt = new Date("2026-09-08T23:59:00.000Z");
  const item = assignment("Engineering Reflection", dueAt.toISOString(), { estimatedMinutes: 90 });
  const result = buildProactivePlan(snapshot([item]), today).assignments.find((entry) => entry.assignmentId === item.id);

  assert.ok(result);
  assert.ok(result.workBlocks.some((block) => block.date < dueAt));
  assert.ok(result.workBlocks.every((block) => block.date < dueAt));
});
test("does not force a distant trivial assignment onto today", () => {
  const today = new Date("2026-09-10T12:00:00.000Z");
  const dueAt = new Date("2026-09-16T23:59:00.000Z");
  const item = assignment("15-minute reading", dueAt.toISOString(), { estimatedMinutes: 15 });
  const result = buildProactivePlan(snapshot([item]), today).assignments.find((entry) => entry.assignmentId === item.id);

  assert.ok(result);
  assert.ok(result.workBlocks.every((block) => block.date > today));
});
test("invalid due dates do not create deadline urgency", () => {
  const [item] = hydrateSchoolPlanningAssignments([{ ...assignment("Malformed deadline", undefined), dueAt: "not-a-date" }]);
  assert.ok(item);
  assert.equal(item.dueAt, undefined);
  const recommendations = buildAcademicRecommendations(buildAcademicState(snapshot([item]), now));
  assert.equal(recommendations[0]?.reasonCodes.includes("OVERDUE"), false);
  assert.equal(recommendations[0]?.reasonCodes.includes("DUE_TODAY"), false);
});
test("proactive plan uses a centralized unknown estimate and excludes completed work", () => {
  const plan = buildProactivePlan(snapshot([
    assignment("unknown", "2026-09-12T23:59:00Z"),
    assignment("done", "2026-09-12T23:59:00Z", { completionStatus: "submitted" }),
  ]), now);
  assert.equal(plan.assignments.find((entry) => entry.assignmentId === "unknown")?.usedDefaultEstimate, true);
  assert.equal(plan.assignments.some((entry) => entry.assignmentId === "done"), false);
});
test("heavy class days receive less derived capacity", () => {
  const classEvent = (id: string, hour: number) => ({ id, title: id, source: "canvas-calendar" as const, type: "class" as const, start: new Date(`2026-09-11T${String(hour).padStart(2, "0")}:00:00Z`), end: new Date(`2026-09-11T${String(hour + 1).padStart(2, "0")}:00:00Z`) });
  const plan = buildProactivePlan({ ...snapshot(), events: [classEvent("a", 8), classEvent("b", 10), classEvent("c", 12)] }, now);
  const heavy = plan.dailyCapacity.find((entry) => entry.date.toDateString() === new Date("2026-09-11T12:00:00Z").toDateString());
  assert.equal(heavy?.classCount, 3);
  assert.ok((heavy?.capacityMinutes ?? 999) < 150);
});
test("exam events create spaced preparation blocks without turning the exam into homework", () => {
  const event = { id: "exam-1", title: "CHEM Exam 2", source: "canvas-calendar" as const, type: "exam" as const, start: new Date("2026-09-14T10:30:00Z"), end: new Date("2026-09-14T12:00:00Z") };
  const plan = buildProactivePlan({ ...snapshot(), events: [event] }, new Date("2026-09-10T12:00:00Z"));
  const result = plan.assignments.find((item) => item.assignmentId === "academic-event:exam-1");
  assert.ok(result);
  assert.equal(result.workType, "exam");
  assert.ok(result.workBlocks.length >= 2);
  assert.equal(result.workBlocks.every((block) => block.date < event.start), true);
});
