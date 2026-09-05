import test from "node:test";
import assert from "node:assert/strict";
import type { FootballSituation, FootballTeamState } from "@/core/contracts/sports/Football";
import { parseFootballFieldPosition, resolveFootballFieldGeometry } from "./field";

const home: FootballTeamState = { team: { id: "home", name: "Home", abbreviation: "HOM" }, score: 0 };
const away: FootballTeamState = { team: { id: "away", name: "Away", abbreviation: "AWY" }, score: 0 };

test("parses provider territory text", () => assert.deepEqual(parseFootballFieldPosition("GB 39"), { territory: "GB", yardLine: 39 }));
test("maps the offense's own 20 to the left side of the canonical field", () => {
    const situation: FootballSituation = { possessionTeamId: "home", fieldPosition: { territory: "HOM", yardLine: 20 }, distance: 10 };
    assert.deepEqual(resolveFootballFieldGeometry(situation, home, away), { lineOfScrimmage: 20, firstDownYardLine: 30, ballYardLine: 20, reliable: true });
});
test("maps opponent territory from the offense's perspective", () => {
    const situation: FootballSituation = { possessionTeamId: "away", fieldPosition: { territory: "HOM", yardLine: 30 }, distance: 10 };
    assert.deepEqual(resolveFootballFieldGeometry(situation, home, away), { lineOfScrimmage: 70, firstDownYardLine: 80, ballYardLine: 70, reliable: true });
    const valid: FootballSituation = { possessionTeamId: "away", fieldPosition: { territory: "AWY", yardLine: 30 }, distance: 10 };
    assert.deepEqual(resolveFootballFieldGeometry(valid, home, away), { lineOfScrimmage: 30, firstDownYardLine: 40, ballYardLine: 30, reliable: true });
});
test("withholds markers when provider identity is insufficient", () => assert.deepEqual(resolveFootballFieldGeometry({ fieldPosition: { yardLine: 48 }, distance: 10 }, home, away), { reliable: false }));
