import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./SportsWidget.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../../../../app/globals.css", import.meta.url), "utf8");

test("Sports keeps home-team stadium selection and readable matchup metadata", () => {
  assert.match(source, /selectNflStadiumBackground\(kioskEvent\.homeTeam\)/);
  assert.match(styles, /\.kiosk-sports-matchup[\s\S]*font-size: clamp\(1\.9rem/);
  assert.match(styles, /\.kiosk-sports-at[\s\S]*margin: \.36em 0 \.28em/);
  assert.match(styles, /\.kiosk-sports-meta[\s\S]*rgba\(248,250,252/);
});
