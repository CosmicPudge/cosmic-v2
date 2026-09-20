import assert from "node:assert/strict";
import test from "node:test";
import { schoolNavigationGroups, schoolBrandLabel, isSchoolNavigationActive, schoolCalendarItemHref, schoolCourseDeletionWarning, schoolSectionDescriptions } from "./studentDemoPresentation";
import type { SchoolCourseIdentity } from "./courseIdentity";

test("primary navigation exposes the six core student destinations", () => {
  assert.deepEqual(schoolNavigationGroups.primary.map((item) => item.label), ["Today", "Courses", "Assignments", "Calendar", "Study", "Resources"]);
});

test("secondary and specialized destinations remain reachable and distinct", () => {
  assert.deepEqual(schoolNavigationGroups.secondary.map((item) => item.href), ["/school/notes", "/school/grades", "/school/goals", "/school/inbox", "/school/week", "/school/schedule", "/school/sources"]);
  assert.deepEqual(schoolNavigationGroups.specialized.map((item) => item.href), ["/school/afrotc", "/school/opords"]);
  assert.notEqual(schoolNavigationGroups.primary.find((item) => item.href.endsWith("resources"))?.label, schoolNavigationGroups.secondary.find((item) => item.href.endsWith("sources"))?.label);
});

test("active route matching includes detail routes without marking Today active everywhere", () => {
  assert.equal(isSchoolNavigationActive("/school/courses/course-1", "/school/courses"), true);
  assert.equal(isSchoolNavigationActive("/school/courses/course-1", "/school"), false);
  assert.equal(isSchoolNavigationActive("/school", "/school"), true);
  assert.equal(isSchoolNavigationActive("/school/notes/new", "/school/notes"), true);
});

test("product chrome uses a generic Cosmic School identity", () => {
  assert.equal(schoolBrandLabel, "Cosmic School");
  assert.equal(schoolBrandLabel.toLowerCase().includes("utah state"), false);
});

const localIdentity: SchoolCourseIdentity = { id: "course-1", name: "Biology", providerCourseIds: [], sources: ["manual"], localCourseId: "course-1", matchStatus: "matched" };
const providerIdentity: SchoolCourseIdentity = { id: "canvas:9", name: "History", providerCourseIds: ["9"], sources: ["canvas-api"], matchStatus: "unmatched" };
const ambiguousIdentity: SchoolCourseIdentity = { id: "canvas:10", name: "History", providerCourseIds: ["10"], sources: ["canvas-api"], matchStatus: "ambiguous" };

test("canonical Calendar assignments and local course meetings link to their detail pages", () => {
  assert.equal(schoolCalendarItemHref({ kind: "DUE", id: "manual:work-1" }, ["manual:work-1"], []), "/school/assignments/manual%3Awork-1");
  assert.equal(schoolCalendarItemHref({ kind: "CLASS", id: "meeting-1", courseId: "course-1" }, [], [localIdentity]), "/school/courses/course-1");
});

test("Calendar links use exact catalog identities and never guess for unmatched or ambiguous IDs", () => {
  assert.equal(schoolCalendarItemHref({ kind: "EVENT", id: "event-1", courseId: "canvas:9" }, [], [providerIdentity]), "/school/courses/canvas%3A9");
  assert.equal(schoolCalendarItemHref({ kind: "EVENT", id: "event-1", courseId: "History" }, [], [providerIdentity]), undefined);
  assert.equal(schoolCalendarItemHref({ kind: "EVENT", id: "event-1", courseId: "canvas:404" }, [], [providerIdentity]), undefined);
  assert.equal(schoolCalendarItemHref({ kind: "EVENT", id: "event-1", courseId: "canvas:10" }, [], [ambiguousIdentity]), undefined);
  assert.equal(schoolCalendarItemHref({ kind: "DUE", id: "duplicate" }, ["duplicate", "duplicate"], []), undefined);
});

test("Resources and Sources copy describes separate student-facing concepts", () => {
  assert.match(schoolSectionDescriptions.Resources, /Course materials/);
  assert.match(schoolSectionDescriptions.Resources, /separate from imported source documents/);
  assert.match(schoolSectionDescriptions.Sources, /Imported school documents and evidence/);
});

test("course deletion warning matches the local repository's cascade and preserved records", () => {
  for (const deleted of ["meetings", "assignments", "grades", "resources"]) assert.match(schoolCourseDeletionWarning, new RegExp(deleted));
  for (const kept of ["Notes", "study sets", "goals"]) assert.match(schoolCourseDeletionWarning, new RegExp(kept));
  assert.match(schoolCourseDeletionWarning, /Canvas-derived data is not changed/);
});
