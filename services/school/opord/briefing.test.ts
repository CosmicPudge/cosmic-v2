import assert from "node:assert/strict";
import test from "node:test";
import { getAfrotcBriefing } from "./briefing";
import type { OpordSource } from "./selectors";
import type { OpordEvent } from "./types";

const event = (id: string, date: string, type: "llab" | "pt", status: "scheduled" | "cancelled" = "scheduled") => ({ id, type, title: type === "pt" ? "Running Seminar" : "Marching Basics", date: { status: "explicit", value: date }, reportTime: { status: "explicit", value: "05:55" }, reportQualifier: { status: "explicit", value: "Pre-Formation" }, startTime: { status: "explicit", value: "06:00" }, endTime: { status: "explicit", value: "07:00" }, location: { status: "explicit", value: "Legacy Fields" }, formUpLocation: { status: "explicit", value: "Legacy Fields" }, activityLocations: [], uniform: { status: "unknown", value: null }, uniformRequirements: [{ audience: "First Term Cadets", uniform: type === "pt" ? "PTG" : "Det Polo" }], bring: ["Water Bottle", "Student ID"], timeline: [], workouts: type === "pt" ? [{ title: "Running Seminar", blocks: [{ category: "Running", exercises: [{ name: "Sit-ups", relevance: "direct-pfra", source: "Attachment 4" }], running: [{ name: "Run", relevance: "direct-pfra", source: "Attachment 4" }] }], notes: [], source: "Attachment 4" }] : [], specialConditions: [], instructions: [], deadlines: [], status, sourceId: "week-02", sourceName: "Week 02", provenance: { sourceName: "Week 02", excerpt: "source" } }) as unknown as OpordEvent;
const source = (events: OpordEvent[]) => ({ id: "week-02", document: { events, isSuperseded: false } }) as unknown as OpordSource;

test("briefing prioritizes today, then tomorrow, then next event", () => {
  const current = source([event("today", "2026-09-05", "pt"), event("tomorrow", "2026-09-06", "llab"), event("next", "2026-09-07", "pt")]);
  assert.equal(getAfrotcBriefing([current], "First Term Cadet", new Date(2026, 8, 5, 8)).status, "today");
  const tomorrow = getAfrotcBriefing([source([event("tomorrow", "2026-09-06", "llab"), event("next", "2026-09-07", "pt")])], "First Term Cadet", new Date(2026, 8, 5, 20));
  assert.equal(tomorrow.status, "tomorrow"); assert.equal(tomorrow.event?.uniform, "Det Polo");
  const next = getAfrotcBriefing([source([event("next", "2026-09-07", "pt")])], "First Term Cadet", new Date(2026, 8, 5, 12));
  assert.equal(next.status, "next"); assert.equal(next.event?.workoutTitle, "Running Seminar"); assert.deepEqual(next.event?.pfraFocus, ["Sit-ups", "Run prep"]);
});

test("cancelled no-PT events do not create AFROTC requirements", () => { const result = getAfrotcBriefing([source([event("cancelled", "2026-09-05", "pt", "cancelled"), event("next", "2026-09-06", "llab")])], "First Term Cadet", new Date(2026, 8, 5, 8)); assert.equal(result.status, "tomorrow"); assert.equal(result.event?.event.id, "next"); });
