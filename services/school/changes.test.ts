import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { detectSchoolChanges } from "./changes.ts";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { buildSchoolSnapshot } from "./domain.ts";

const base = { mission: { title: "", subtitle: "", priority: "low" as const }, focus: { title: "", priority: "low" as const, progress: 0, estimatedMinutes: 0, reason: "" }, headline: "", status: "", timeline: [], stats: { classesToday: 0, assignmentsDueToday: 0, afrotcEvents: 0 }, semester: { semester: "", week: 1, progress: 0 }, events: [], classes: [], assignments: [], announcements: [] };
const assignment = (due: string) => ({ id: "a1", title: "Reading Response 8", due: new Date(due), completed: false, priority: "medium" as const });

test("initial School import is a baseline and due-date changes produce one candidate", () => {
  const first = buildSchoolSnapshot({ ...base, assignments: [assignment("2026-09-30T18:00:00Z")] });
  const second = buildSchoolSnapshot({ ...base, assignments: [assignment("2026-10-02T18:00:00Z")] });
  assert.deepEqual(detectSchoolChanges(null, first), []);
  assert.equal(detectSchoolChanges(first, second).map((item) => item.type).join(), "assignment_due_date_changed");
  assert.deepEqual(detectSchoolChanges(first, second), detectSchoolChanges(first, second));
});

test("provider failure is not interpreted as mass deletion", () => {
  const first = buildSchoolSnapshot({ ...base, assignments: [assignment("2026-09-30T18:00:00Z")] });
  const failed = { ...buildSchoolSnapshot({ ...base }), sourceStatus: { canvas: "error" as const } };
  assert.deepEqual(detectSchoolChanges(first, failed), []);
});
