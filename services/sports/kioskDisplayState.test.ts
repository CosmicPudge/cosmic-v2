import assert from "node:assert/strict";
import test from "node:test";
import type { SportsEvent } from "@/core/contracts/Sports";
import { resolveF1DisplayState } from "./kioskDisplayState";

const now = new Date("2026-10-03T04:30:00Z");
function f1(status: SportsEvent["status"], start = now, end?: Date): SportsEvent {
  return { id: "f1-state", sport: "f1", title: "Malaysian Grand Prix · Practice 3", start, ...(end ? { end } : {}), status, source: "test", metadata: { sessionType: "Practice 3" } };
}

test("scheduled F1 sessions remain upcoming before their start", () => {
  const result = resolveF1DisplayState(f1("scheduled", new Date(now.getTime() + 30_000)), now);
  assert.equal(result.displayState, "upcoming");
  assert.equal(result.inferredLive, false);
});

test("a scheduled F1 session is inferred live only inside its bounded window", () => {
  const result = resolveF1DisplayState(f1("scheduled", new Date(now.getTime() - 30 * 60_000)), now);
  assert.equal(result.displayState, "live");
  assert.equal(result.inferredLive, true);
});

test("F1 sessions become complete after their bounded window", () => {
  const start = new Date(now.getTime() - 3 * 60 * 60_000);
  assert.equal(resolveF1DisplayState(f1("scheduled", start), now).displayState, "complete");
  assert.equal(resolveF1DisplayState(f1("final", now), now).displayState, "complete");
});
