import test from "node:test";
import assert from "node:assert/strict";
import type { SportsEvent } from "@/core/contracts/Sports";
import { resolveMotorsportTrack } from "./tracks";

const event = (sport: "f1" | "nascar", metadata: SportsEvent["metadata"], venue = "Track") => ({ id: "event", sport, title: "Race", start: new Date(), status: "scheduled", venue, source: "test", metadata }) as SportsEvent;

test("resolves different F1 provider circuits to different real assets", () => {
  const monza = resolveMotorsportTrack(event("f1", { circuitId: "monza" }));
  const austin = resolveMotorsportTrack(event("f1", { circuitId: "americas" }));
  assert.equal(monza?.outlineAsset, "/sports/tracks/f1/monza.svg");
  assert.equal(austin?.outlineAsset, "/sports/tracks/f1/austin.svg");
  assert.notEqual(monza?.outlineAsset, austin?.outlineAsset);
});

test("resolves NASCAR configuration-specific assets and fails text-only for unknown tracks", () => {
  const daytona = resolveMotorsportTrack(event("nascar", { trackId: "27", trackConfiguration: "Tri-Oval Circuit" }, "Daytona International Speedway"));
  const cota = resolveMotorsportTrack(event("nascar", { trackId: "20.3" }, "Circuit of the Americas"));
  const unknown = resolveMotorsportTrack(event("nascar", { trackId: "unknown" }, "Unknown Speedway"));
  assert.equal(daytona?.configuration, "Tri-Oval Circuit");
  assert.equal(cota?.outlineAsset, "/sports/tracks/nascar/cota-nascar.svg");
  assert.equal(unknown, undefined);
});
