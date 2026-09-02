import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { classifyEvent } from "./classifier.ts";

test("Canvas assignment URL takes priority over the assignment title", () => {
  for (const title of [
    "Reading Response 8",
    "Reading Response 9",
    "Writing Center Tutoring Session 1",
    "Summary and Analysis 2: Draft and Peer Review",
    "Annotated Bibliography",
    "Literature Review",
    "Research Presentation",
    "Revision Portfolio",
  ]) {
    assert.equal(
      classifyEvent(title, "", { url: "https://canvas.example.test/courses/1/assignments/8" }),
      "assignment",
      title
    );
  }
});

test("Canvas calendar event URL identifies a class without labeling every event an assignment", () => {
  assert.equal(
    classifyEvent("ENGL 101", "", { url: "https://canvas.example.test/calendar_events/20" }),
    "class"
  );
  assert.equal(
    classifyEvent("Writing Center Tutoring Session 1", "Office hours", { url: "https://canvas.example.test/calendar_events/21" }),
    "class"
  );
  assert.equal(classifyEvent("Campus event", "Office hours"), "other");
});

test("classifies academic calendar categories without dropping uncertain events", () => {
  assert.equal(classifyEvent("Midterm Exam"), "exam");
  assert.equal(classifyEvent("Quiz 2"), "quiz");
  assert.equal(classifyEvent("Discussion: Week 3"), "discussion");
  assert.equal(classifyEvent("Module 2 Due"), "module");
  assert.equal(classifyEvent("Academic reminder"), "other");
});

test("assignment fallback still recognizes explicit assignment language", () => {
  assert.equal(classifyEvent("Revision Portfolio"), "other");
  assert.equal(classifyEvent("Quiz 4"), "quiz");
  assert.equal(classifyEvent("Research Presentation", "Assignment submission"), "assignment");
});
