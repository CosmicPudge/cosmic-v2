import assert from "node:assert/strict";
import test from "node:test";
import { neutralPreferences } from "@/services/settings/preferences";
import { sportsProviders } from "./index";

test("CFB scoreboard provider follows enabledSports", () => {
  assert.equal(sportsProviders(neutralPreferences).some((provider) => provider.id === "espn-college-football-scoreboard"), true);
  const disabled = { ...neutralPreferences, sports: { ...neutralPreferences.sports, enabledSports: neutralPreferences.sports.enabledSports.filter((sport) => sport !== "college-football") } };
  assert.equal(sportsProviders(disabled).some((provider) => provider.id === "espn-college-football-scoreboard"), false);
});
