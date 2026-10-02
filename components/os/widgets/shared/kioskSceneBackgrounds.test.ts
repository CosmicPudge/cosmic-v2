import assert from "node:assert/strict";
import test from "node:test";
import { selectNflStadiumBackground } from "./kioskSceneBackgrounds";

test("NFL kiosk scenes use the home team's stadium", () => {
  assert.equal(selectNflStadiumBackground({ name: "Detroit Lions", abbreviation: "DET" }), "/kiosk/scenes/sports/nfl/det.webp");
  assert.equal(selectNflStadiumBackground({ name: "Green Bay Packers", abbreviation: "GB" }), "/kiosk/scenes/sports/nfl/gb.webp");
  assert.equal(selectNflStadiumBackground({ name: "New York Jets", abbreviation: "NYJ" }), "/kiosk/scenes/sports/nfl/nyj.webp");
  assert.equal(selectNflStadiumBackground({ name: "New York Giants", abbreviation: "NYG" }), "/kiosk/scenes/sports/nfl/nyg.webp");
  assert.equal(selectNflStadiumBackground({ name: "Los Angeles Chargers", abbreviation: "LAC" }), "/kiosk/scenes/sports/nfl/lac.webp");
  assert.equal(selectNflStadiumBackground({ name: "Los Angeles Rams", abbreviation: "LAR" }), "/kiosk/scenes/sports/nfl/lar.webp");
  assert.equal(selectNflStadiumBackground({ name: "Unknown NFL Club" }), "/dashboard/sports/stadium.webp");
});
