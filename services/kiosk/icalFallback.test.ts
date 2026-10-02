import assert from "node:assert/strict";
import test from "node:test";
import { fetchKioskCalendarIcalFeeds, fetchKioskCanvasIcal } from "./icalFallback";

const calendar = (events: string[]) => ["BEGIN:VCALENDAR", "VERSION:2.0", ...events, "END:VCALENDAR"].join("\r\n");
const event = (uid: string, summary: string, start: string, end: string, extra = "") => ["BEGIN:VEVENT", `UID:${uid}`, `DTSTART:${start}`, `DTEND:${end}`, `SUMMARY:${summary}`, extra, "END:VEVENT"].filter(Boolean).join("\r\n");

function response(body: string, status = 200) {
  return new Response(body, { status, headers: { "content-type": "text/calendar" } });
}

test("merges two iCloud feeds, deduplicates events, and sorts chronologically", async () => {
  const duplicate = event("duplicate", "Shared event", "20261003T100000Z", "20261003T110000Z");
  const later = event("later", "Later event", "20261004T100000Z", "20261004T110000Z");
  const earlier = event("earlier", "Earlier event", "20261002T100000Z", "20261002T110000Z");
  const result = await fetchKioskCalendarIcalFeeds(["https://calendar.invalid/one", "https://calendar.invalid/two"], async (input) => response(String(input).endsWith("one") ? calendar([later, duplicate]) : calendar([duplicate, earlier])));
  assert.equal(result.feedCount, 2);
  assert.equal(result.category, "connected");
  assert.deepEqual(result.events.map((item) => item.id), ["earlier", "duplicate", "later"]);
});

test("keeps one iCloud feed connected when the other fails", async () => {
  const result = await fetchKioskCalendarIcalFeeds(["https://calendar.invalid/good", "https://calendar.invalid/bad"], async (input) => String(input).endsWith("good") ? response(calendar([event("good", "Good event", "20261002T100000Z", "20261002T110000Z")])) : response("", 503));
  assert.equal(result.feedCount, 1);
  assert.equal(result.category, "connected");
  assert.equal(result.events.length, 1);
});

test("parses Canvas upcoming and overdue assignments", async () => {
  const ics = calendar([
    event("upcoming", "Read chapter assignment", "20300103T100000Z", "20300103T110000Z", "URL:https://canvas.example/courses/42/assignments/7"),
    event("overdue", "Submit lab", "20200103T100000Z", "20200103T110000Z", "URL:https://canvas.example/courses/42/assignments/8"),
  ]);
  const result = await fetchKioskCanvasIcal("https://canvas.invalid/feed", async () => response(ics));
  assert.equal(result.parsedEvents, 2);
  assert.equal(result.data.assignments.length, 2);
  assert.equal(result.data.assignments.some((item) => item.id === "upcoming" && item.due.getUTCFullYear() === 2030), true);
  assert.equal(result.data.assignments.some((item) => item.id === "overdue" && item.due.getUTCFullYear() === 2020), true);
});

test("malformed feeds fail without returning feed URLs or raw content", async () => {
  const feedUrl = "https://calendar.invalid/private-feed?token=do-not-return";
  const result = await fetchKioskCalendarIcalFeeds([feedUrl], async () => response("not-an-ics"));
  assert.equal(result.feedCount, 0);
  assert.equal(result.category, "parse-error");
  assert.equal(JSON.stringify(result).includes(feedUrl), false);
  assert.equal(JSON.stringify(result).includes("not-an-ics"), false);
  await assert.rejects(() => fetchKioskCanvasIcal("https://canvas.invalid/private-feed?token=do-not-return", async () => response("not-an-ics")), /could not be parsed/);
});
