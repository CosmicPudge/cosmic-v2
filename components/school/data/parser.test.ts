import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { parseCanvasCalendarWithDiagnostics } from "./parser.ts";

test("parses the full VEVENT and preserves source metadata", () => {
  const result = parseCanvasCalendarWithDiagnostics(`BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Cosmic//School//EN\nBEGIN:VEVENT\nUID:assignment-1\nDTSTART;VALUE=DATE:20260910\nDTEND;VALUE=DATE:20260911\nSUMMARY:Homework 4\nDESCRIPTION:Read chapter 4\nLOCATION:Online\nURL:https://canvas.example.test/courses/12/assignments/4\nSTATUS:CONFIRMED\nRECURRENCE-ID;VALUE=DATE:20260910\nRRULE:FREQ=WEEKLY\nLAST-MODIFIED:20260901T120000Z\nDTSTAMP:20260901T120000Z\nSEQUENCE:2\nEND:VEVENT\nBEGIN:VEVENT\nUID:quiz-1\nDTSTART:20260912T230000Z\nDTEND:20260912T233000Z\nSUMMARY:Quiz 2\nEND:VEVENT\nEND:VCALENDAR`);
  assert.equal(result.diagnostics.totalIcsEvents, 2); assert.equal(result.events.length, 2); assert.equal(result.events[0].allDay, true); assert.equal(result.events[0].type, "assignment"); assert.equal(result.events[0].courseId, "12"); assert.equal(result.events[0].sourceMetadata?.uid, "assignment-1"); assert.equal(result.events[0].sourceMetadata?.url, "https://canvas.example.test/courses/12/assignments/4"); assert.equal(result.events[0].sourceMetadata?.sequence, 2); assert.equal(result.events[1].type, "quiz");
});

test("keeps valid events when one VEVENT is malformed", () => {
  const result = parseCanvasCalendarWithDiagnostics("BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:valid\nDTSTART:20260912T230000Z\nDTEND:20260912T233000Z\nSUMMARY:Quiz 2\nEND:VEVENT\nBEGIN:VEVENT\nUID:bad\nDTSTART:not-a-date\nSUMMARY:Broken\nEND:VEVENT\nEND:VCALENDAR");
  assert.equal(result.diagnostics.totalIcsEvents, 2); assert.equal(result.events.length, 1); assert.equal(result.events[0].id, "valid");
});
