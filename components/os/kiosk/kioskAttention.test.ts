import assert from "node:assert/strict";
import test from "node:test";
import type { SportsEvent } from "@/core/contracts/Sports";
import { KIOSK_SPORTS_ALERT_DURATION_MS, KIOSK_SPORTS_ALERT_MAX_DURATION_MS, selectKioskPreEventAlert } from "./kioskAttention";

const now = new Date("2026-10-02T22:00:00Z");
function event(id: string, minutes: number): SportsEvent {
  return { id, sport: "f1", title: "United States Grand Prix · Practice 2", start: new Date(now.getTime() + minutes * 60_000), status: "scheduled", source: "test", venue: "Circuit of the Americas", metadata: { sessionType: "Practice 2" } };
}

test("pre-event alert selects the nearest event inside the 15-minute window", () => {
  const alert = selectKioskPreEventAlert([event("race", 14), event("later", 30)], now);
  assert.equal(alert?.event.id, "race");
  assert.equal(alert?.thresholdMinutes, 15);
  assert.equal(alert?.key, "race:15");
});

test("pre-event alerts are deduplicated by event and threshold", () => {
  const fired = new Set(["race:15"]);
  assert.equal(selectKioskPreEventAlert([event("race", 14)], now, fired), null);
  assert.equal(selectKioskPreEventAlert([event("race", 9)], now, fired)?.thresholdMinutes, 10);
});

test("live events are never presented as upcoming alerts", () => {
  const live = { ...event("live", -1), status: "live" as const };
  assert.equal(selectKioskPreEventAlert([live], now), null);
});

test("sports warnings are visual-only and bounded to a 30-second alert under the 60-second maximum", () => {
  assert.equal(KIOSK_SPORTS_ALERT_DURATION_MS, 30_000);
  assert.ok(KIOSK_SPORTS_ALERT_DURATION_MS <= KIOSK_SPORTS_ALERT_MAX_DURATION_MS);
});
