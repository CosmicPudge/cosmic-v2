import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { buildAcademicRecommendations, buildAcademicState } from "./academicPlanner.ts";
import type { SchoolSnapshot } from "@/services/school/domain";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";

const now = new Date("2026-09-10T12:00:00.000Z");
function assignment(id: string, dueAt: string | undefined, extra: Partial<SchoolPlanningAssignment> = {}): SchoolPlanningAssignment { return { id, accountId: "test", title: id, sourceType: "manual", completionStatus: "upcoming", planningStatus: "not_started", priority: "normal", createdAt: now, updatedAt: now, ...(dueAt ? { dueAt: new Date(dueAt) } : {}), ...extra }; }
function snapshot(assignments: SchoolPlanningAssignment[] = []): SchoolSnapshot { return { courses: [], assignments: [], events: [], actionItems: [], facts: [], notes: [], topics: [], requirements: [], importantFacts: [], sources: [], updatedAt: now.toISOString(), planningAssignments: assignments }; }

test("overdue beats future and completed work is excluded", () => { const state = buildAcademicState(snapshot([assignment("future", "2026-09-17T12:00:00Z"), assignment("overdue", "2026-09-09T12:00:00Z"), assignment("done", "2026-09-09T12:00:00Z", { completionStatus: "completed" })]), now); const recommendations = buildAcademicRecommendations(state); assert.equal(recommendations[0].assignmentId, "overdue"); assert.equal(recommendations.some((item) => item.assignmentId === "done"), false); });
test("known short task is a quick win; unknown duration is not", () => { const recommendations = buildAcademicRecommendations(buildAcademicState(snapshot([assignment("short", "2026-09-17T12:00:00Z", { estimatedMinutes: 30 }), assignment("unknown", "2026-09-17T12:00:00Z")]), now)); const short = recommendations.find((item) => item.assignmentId === "short"); const unknown = recommendations.find((item) => item.assignmentId === "unknown"); assert.equal(short?.reasonCodes.includes("SHORT_TASK"), true); assert.equal(unknown?.reasonCodes.includes("SHORT_TASK"), false); });
test("empty snapshot is safe", () => { const result = buildAcademicRecommendations(buildAcademicState(snapshot(), now)); assert.deepEqual(result, []); });
