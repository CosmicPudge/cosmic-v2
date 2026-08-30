import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { hydrateSchoolDashboard } from "./normalize.ts";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { buildSchoolSnapshot } from "../../../services/school/domain.ts";

const data = {
  mission: { title: "Study", subtitle: "", priority: "medium" as const },
  focus: { title: "Reading Response", priority: "medium" as const, progress: 0, estimatedMinutes: 30, reason: "Due soon" },
  headline: "School",
  status: "Ready",
  timeline: [],
  stats: { classesToday: 0, assignmentsDueToday: 1, afrotcEvents: 0 },
  semester: { semester: "Fall", week: 1, progress: 0 },
  events: [{ id: "event-1", title: "Class", start: new Date("2026-09-01T12:00:00Z"), end: new Date("2026-09-01T13:00:00Z"), type: "class" as const, source: "canvas-calendar" as const }],
  classes: [],
  assignments: [{ id: "assignment-1", title: "Reading Response", due: new Date("2026-09-01T18:00:00Z"), completed: false, priority: "medium" as const }],
  announcements: [],
};

test("rebuilds a client School snapshot with Date fields after JSON serialization", () => {
  const serialized = JSON.parse(JSON.stringify(data));
  const hydrated = hydrateSchoolDashboard(serialized);
  const snapshot = buildSchoolSnapshot(hydrated);

  assert.equal(snapshot.assignments[0]?.due instanceof Date, true);
  assert.equal(snapshot.events[0]?.start instanceof Date, true);
  assert.equal(snapshot.events[0]?.end instanceof Date, true);
  assert.doesNotThrow(() => snapshot.assignments[0]?.due.getTime());
  assert.doesNotThrow(() => snapshot.events[0]?.start.getTime());
});

test("skips malformed external School dates without throwing", () => {
  const serialized = JSON.parse(JSON.stringify({
    ...data,
    events: [...data.events, { ...data.events[0], id: "bad-event", start: "not-a-date" }],
    assignments: [...data.assignments, { ...data.assignments[0], id: "bad-assignment", due: "not-a-date" }],
  }));

  assert.doesNotThrow(() => hydrateSchoolDashboard(serialized));
  const hydrated = hydrateSchoolDashboard(serialized);
  assert.equal(hydrated.events.some((event) => event.id === "bad-event"), false);
  assert.equal(hydrated.assignments.some((assignment) => assignment.id === "bad-assignment"), false);
});
