import assert from "node:assert/strict";
import test from "node:test";
import { normalizeKioskSportsEvent } from "@/services/sports/kioskSelection";
import { createKioskSportsTestEvent, parseKioskSportsTestOverride } from "./kioskSportsTestOverride";
import { getKioskSportsScenePresentation } from "./sports/KioskSportsScene";

const devHost = "dev.cosmicpudge.shop";

test("NFL override forces the requested home and away teams", () => {
  const override = parseKioskSportsTestOverride(new URLSearchParams("sport=nfl&away=GB&venue=tb"), devHost, "/kiosk");
  const event = override && createKioskSportsTestEvent(override);
  assert.equal(event?.awayTeam?.abbreviation, "GB");
  assert.equal(event?.homeTeam?.abbreviation, "TB");
  assert.equal(normalizeKioskSportsEvent(event!)?.backgroundKey, "nfl-tb");
});

test("venue overrides select MLB stadiums, F1 circuits, and NASCAR tracks", () => {
  const mlb = parseKioskSportsTestOverride(new URLSearchParams("sport=mlb&venue=nyy"), devHost, "/kiosk");
  const f1 = parseKioskSportsTestOverride(new URLSearchParams("sport=f1&venue=malaysia&session=practice2"), devHost, "/kiosk");
  const nascar = parseKioskSportsTestOverride(new URLSearchParams("sport=nascar&venue=las-vegas&session=race"), devHost, "/kiosk");
  assert.equal(normalizeKioskSportsEvent(createKioskSportsTestEvent(mlb!))?.backgroundKey, "mlb-yankee-stadium");
  assert.equal(normalizeKioskSportsEvent(createKioskSportsTestEvent(f1!))?.backgroundKey, "f1-malaysia");
  assert.equal(normalizeKioskSportsEvent(createKioskSportsTestEvent(nascar!))?.backgroundKey, "nascar-las-vegas");
  assert.equal(createKioskSportsTestEvent(f1!).metadata?.sessionType, "Practice 2");
});

test("shared Sports scene presentation preserves exact venue backgrounds", () => {
  const mlb = parseKioskSportsTestOverride(new URLSearchParams("sport=mlb&venue=bos"), devHost, "/kiosk");
  const f1 = parseKioskSportsTestOverride(new URLSearchParams("sport=f1&venue=suzuka&session=practice3"), devHost, "/kiosk");
  const nascar = parseKioskSportsTestOverride(new URLSearchParams("sport=nascar&venue=las-vegas"), devHost, "/kiosk");

  assert.equal(getKioskSportsScenePresentation(createKioskSportsTestEvent(mlb!)).backgroundKey, "mlb-fenway-park");
  assert.equal(getKioskSportsScenePresentation(createKioskSportsTestEvent(f1!)).backgroundKey, "f1-japan");
  assert.equal(getKioskSportsScenePresentation(createKioskSportsTestEvent(nascar!)).backgroundSource, "exact-venue");
});

test("manual overrides are disabled outside the dedicated dev kiosk hosts", () => {
  const params = new URLSearchParams("sport=nfl&venue=gb");
  assert.equal(parseKioskSportsTestOverride(params, "cosmicpudge.shop", "/kiosk"), null);
  assert.equal(parseKioskSportsTestOverride(params, "cosmic-v2.vercel.app", "/kiosk"), null);
  assert.equal(parseKioskSportsTestOverride(params, devHost, "/os/kiosk"), null);
  assert.ok(parseKioskSportsTestOverride(params, "localhost", "/kiosk"));
});

test("no sport override preserves automatic selection", () => {
  assert.equal(parseKioskSportsTestOverride(new URLSearchParams(), devHost, "/kiosk"), null);
});

test("dev celebration overrides are bounded to supported values", () => {
  assert.equal(parseKioskSportsTestOverride(new URLSearchParams("sport=mlb&venue=laa&celebration=homerun"), devHost, "/kiosk")?.celebration, "homerun");
  assert.equal(parseKioskSportsTestOverride(new URLSearchParams("sport=mlb&celebration=flash"), devHost, "/kiosk")?.celebration, undefined);
});
