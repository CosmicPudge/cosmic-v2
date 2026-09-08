import assert from "node:assert/strict";
import test from "node:test";
import { calendarRangeForRequest, serializeAccountSettings, serializeSportsEvent, serializeWeatherData } from "./deterministic";
import { neutralPreferences, referencePreferences } from "@/services/settings/preferences";

test("weather output is compact and excludes forecast payloads", () => {
  const value = serializeWeatherData({ city: "Salt Lake City", lat: 40.7, lon: -111.9, temp: 70, feelsLike: 69, precipitation24h: 0, windSpeed: 4, windDirection: 180, condition: "Clear", description: "clear sky", lastUpdated: "now", weatherAlerts: [{ event: "Heat", severity: "minor", headline: "Stay hydrated", expires: "later", id: "secret-id", description: "private detail" }], hourlyForecast: [], dailyForecast: [], icon: "01d", high: 80, low: 50, humidity: 20, sunrise: 0, sunset: 0, daylightProgress: 0, dayLength: "", airQuality: { aqi: 1, pm25: 1, pm10: 1, ozone: 1, no2: 1, co: 1 }, uvIndex: 1, astronomy: { moonPhase: 0, moonPhaseName: "", illumination: 0, moonrise: 0, moonset: 0, nextFullMoon: "", nextNewMoon: "" } });
  assert.equal(value.available, true);
  assert.equal("hourlyForecast" in value, false);
  assert.equal(value.alerts[0]?.event, "Heat");
  assert.equal(JSON.stringify(value).includes("secret-id"), false);
});

test("calendar requests are bounded to fourteen days", () => {
  const range = calendarRangeForRequest("upcoming", new Date("2026-09-07T12:00:00Z"));
  assert.equal(range.valid, true);
  if (range.valid) assert.ok(range.end.getTime() - range.start.getTime() <= 14 * 24 * 60 * 60 * 1000);
  assert.equal(calendarRangeForRequest("range", new Date("2026-09-07T12:00:00Z"), "2026-01-01", "2026-02-01").valid, false);
});

test("sports output resolves known team identity and favorite state", () => {
  const value = serializeSportsEvent({ id: "game-1", sport: "nfl", title: "Packers game", start: new Date("2026-09-07T19:00:00Z"), status: "scheduled", source: "test", homeTeam: { id: "gb", name: "Green Bay Packers", abbreviation: "GB" }, awayTeam: { name: "Denver Broncos", abbreviation: "DEN" } }, referencePreferences);
  assert.equal(value.favorite, true);
  assert.equal(value.homeTeam?.identity?.canonicalId, "gb");
  assert.equal(serializeSportsEvent({ id: "game-2", sport: "nfl", title: "Other", start: new Date(), status: "scheduled", source: "test", homeTeam: { name: "Other" } }, neutralPreferences).favorite, false);
});

test("account settings projection is owner-safe and excludes private identifiers", () => {
  const value = serializeAccountSettings({ id: "private-id", email: "private@example.com", displayName: "Cosmic", createdAt: "", updatedAt: "" }, referencePreferences, true);
  assert.equal(value.displayName, "Cosmic");
  assert.equal("id" in value, false);
  assert.equal("email" in value, false);
  assert.equal(value.favoriteTeams[0]?.label, "Los Angeles Angels");
});
