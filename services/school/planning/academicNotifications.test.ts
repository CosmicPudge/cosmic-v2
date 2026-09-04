import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { buildAcademicBriefing, buildAcademicNotifications } from "./academicNotifications.ts";
import type { SchoolSnapshot } from "@/services/school/domain";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";

const now = new Date("2026-09-10T12:00:00.000Z");
function assignment(id: string, due: string, extra: Partial<SchoolPlanningAssignment> = {}): SchoolPlanningAssignment { return { id, accountId: "test", title: id, sourceType: "manual", dueAt: new Date(due), completionStatus: "upcoming", planningStatus: "not_started", priority: "normal", createdAt: now, updatedAt: now, ...extra }; }
function snapshot(assignments: SchoolPlanningAssignment[]): SchoolSnapshot { return { courses: [], assignments: [], events: [], actionItems: [], facts: [], notes: [], topics: [], requirements: [], importantFacts: [], sources: [], updatedAt: now.toISOString(), planningAssignments: assignments }; }

test("work-today notification is generated from the proactive plan", () => {
  const result = buildAcademicNotifications(snapshot([assignment("reflection", "2026-09-12T23:59:00Z", { estimatedMinutes: 45 })]), now);
  assert.equal(result.length, 1);
  assert.match(result[0].id, /^school:reflection:(WORK_TODAY|FINISH_TODAY):/);
  assert.match(result[0].title, /reflection/);
});

test("completion suppresses future notifications and budget remains bounded", () => {
  const items = Array.from({ length: 8 }, (_, index) => assignment(`item-${index}`, "2026-09-11T23:59:00Z", { estimatedMinutes: 45 }));
  items[0] = { ...items[0], completionStatus: "submitted" };
  const result = buildAcademicNotifications(snapshot(items), now);
  assert.equal(result.length, 4);
  assert.equal(result.some((item) => item.id.includes("item-0")), false);
});

test("briefing summarizes classes, tomorrow deadlines, and planned minutes", () => {
  const result = buildAcademicBriefing({ ...snapshot([assignment("quiz", "2026-09-11T23:59:00Z", { estimatedMinutes: 30 })]), events: [{ id: "class", title: "CHEM 1210", source: "canvas-calendar", type: "class", start: new Date("2026-09-10T09:30:00Z"), end: new Date("2026-09-10T10:30:00Z") }] }, now);
  assert.equal(result.title, "TODAY AT SCHOOL");
  assert.equal(result.classesToday, 1);
  assert.equal(result.dueTomorrow, 1);
  assert.equal(result.plannedMinutes, 30);
});
