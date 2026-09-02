import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { canonicalCanvasCalendarId, dedupeSchoolAssignments } from "./assignmentIdentity.ts";

const date = new Date("2026-09-01T00:00:00Z");
const base = { accountId: "a", title: "Homework", sourceType: "canvas-calendar" as const, completionStatus: "unknown" as const, planningStatus: "not_started" as const, priority: "high" as const, createdAt: date, updatedAt: date, externalId: "event-assignment-5350137" };
test("does not double-prefix Canvas calendar identities", () => { assert.equal(canonicalCanvasCalendarId("canvas-calendar:event-assignment-5350137"), "canvas-calendar:event-assignment-5350137"); });
test("dedupes REST and calendar projections by canonical Canvas URL", () => { const result = dedupeSchoolAssignments([{ ...base, id: "canvas-calendar:event-assignment-5350137", canvasUrl: "https://canvas.test/courses/1/assignments/7" }, { ...base, id: "canvas-api:1:7", sourceType: "canvas-api", completionStatus: "submitted", canvasUrl: "https://canvas.test/courses/1/assignments/7" }]); assert.equal(result.length, 1); assert.equal(result[0].id, "canvas-api:1:7"); assert.equal(result[0].completionStatus, "submitted"); assert.equal(result[0].priority, "high"); });
