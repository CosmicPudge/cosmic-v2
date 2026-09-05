import assert from "node:assert/strict";
import test from "node:test";
import { rankDashboardContext } from "./contextPriority";
import type { CosmicContextItem } from "@/core/contracts/Context";

const now = new Date("2026-09-05T08:00:00-06:00");
const item = (overrides: Partial<CosmicContextItem>): CosmicContextItem => ({ id: "item", source: "calendar", kind: "next-event", priority: "glance", title: "Event", timestamp: now.toISOString(), ...overrides });

test("chooses one highest-priority primary and keeps next up chronological", () => {
  const plan = rankDashboardContext([
    item({ id: "sports:live", source: "sports", kind: "live-event", title: "Packers live" }),
    item({ id: "calendar:later", startsAt: "2026-09-05T15:00:00-06:00", title: "LLAB" }),
    item({ id: "calendar:soon", startsAt: "2026-09-05T10:00:00-06:00", title: "Class" }),
  ], { now });
  assert.equal(plan.primary?.item.id, "sports:live");
  assert.deepEqual(plan.nextUp.map((candidate) => candidate.item.id), ["calendar:soon", "calendar:later"]);
});

test("dedupes shared entities without deleting unrelated context", () => {
  const plan = rankDashboardContext([
    item({ id: "calendar:afrotc", metadata: { entityId: "afrotc:1" }, title: "AFROTC" }),
    item({ id: "school:afrotc", source: "school", metadata: { entityId: "afrotc:1" }, title: "AFROTC details", priority: "attention" }),
    item({ id: "mail:unread", source: "mail", kind: "unread", title: "Unread" }),
  ], { now });
  assert.equal(plan.candidates.length, 2);
  assert.equal(plan.primary?.item.id, "school:afrotc");
});
