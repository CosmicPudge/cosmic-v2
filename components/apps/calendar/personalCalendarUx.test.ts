import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./PersonalCalendarConnection.tsx", import.meta.url), "utf8");
const view = readFileSync(new URL("./CalendarView.tsx", import.meta.url), "utf8");
const connectionRoute = readFileSync(new URL("../../../app/api/calendar/personal-connection/route.ts", import.meta.url), "utf8");
const proxy = readFileSync(new URL("../../../proxy.ts", import.meta.url), "utf8");

test("Personal Calendar UX uses metadata-only status and an HTTPS credential form", () => {
  assert.match(source, /\/api\/calendar\/personal-connection/);
  assert.match(source, /type="password"/);
  assert.match(source, /https:\/\//);
  assert.equal(source.includes("localStorage"), false);
  assert.equal(source.includes("sessionStorage"), false);
  assert.equal(source.includes("accountId"), false);
  assert.equal(source.includes("ownerId"), false);
  assert.equal(source.includes("userId"), false);
});

test("Calendar page renders the personal connection surface from server-derived status", () => {
  assert.match(view, /personalStatus/);
  assert.match(view, /PersonalCalendarConnection/);
  assert.match(view, /personalMode/);
  assert.equal(view.includes("\/api\/account\/session"), false);
  assert.equal(proxy.includes('pathname === "/calendar"'), true);
});

test("Personal Calendar status never returns a live-provider verification claim", () => {
  assert.match(connectionRoute, /verified: false/);
  assert.equal(connectionRoute.includes("getPersonalCalendarContext"), false);
  assert.equal(connectionRoute.includes("password"), true);
});
