import assert from "node:assert/strict";
import test from "node:test";
import type { Assignment, Course, SchoolTerm } from "@/core/contracts/School";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import { normalizeLocalSchoolData } from "@/components/school/data/localDataHydration";
import { assignmentDetailCourseHref, assignmentDetailHref, resolveAssignmentDetail } from "./assignmentDetail";
import { buildSchoolCourseCatalog } from "./courseIdentity";
import { dedupeSchoolAssignments } from "./assignmentIdentity";

const term: SchoolTerm = { id: "fall", name: "Fall 2026", active: true };
const course: Course = { id: "as1010-local", code: "AS 1010", name: "Heritage and Values", termId: term.id, meetingTimes: [] };
const providerCourse = { id: "818707", name: "Heritage and Values", courseCode: "AS 1010", workflowState: "available" };
const assignment = (overrides: Partial<SchoolPlanningAssignment> = {}): SchoolPlanningAssignment => ({ id: "canvas-api:818707:42", accountId: "local", title: "Provider assignment", sourceType: "canvas-api", courseId: "818707", courseName: "Heritage and Values", completionStatus: "upcoming", planningStatus: "not_started", priority: "normal", createdAt: new Date("2026-09-01T00:00:00Z"), updatedAt: new Date("2026-09-01T00:00:00Z"), ...overrides });
const baseInput = (overrides: Partial<Parameters<typeof resolveAssignmentDetail>[0]> = {}) => ({ assignmentId: "missing", localReady: true, providerLoading: false, localAssignments: [] as Assignment[], courses: [course], terms: [term], providerCourses: [providerCourse], providerAssignments: [] as SchoolPlanningAssignment[], ...overrides });

test("workload href retains the persisted local assignment ID in the manual namespace", () => {
  const persistedId = "a91b-local-id";
  const href = assignmentDetailHref(`manual:${persistedId}`);
  assert.equal(href, `/school/assignments/manual%3A${persistedId}`);
  assert.ok(href.includes(persistedId));
  assert.equal(decodeURIComponent(href.split("/").at(-1)!), `manual:${persistedId}`);
});

test("detail waits for localStorage hydration, then resolves the serialized local assignment", () => {
  const requestedId = "manual:persisted-as1010-assignment";
  const beforeHydration = resolveAssignmentDetail(baseInput({ assignmentId: requestedId, localReady: false }));
  assert.deepEqual(beforeHydration, { state: "loading" });

  const hydrated = normalizeLocalSchoolData({
    version: 1,
    terms: [term],
    courses: [course],
    assignments: [{ id: "persisted-as1010-assignment", courseId: course.id, title: "Excused Absence or Tardy Memorandum", description: "Memorandum details", status: "upcoming", priority: "high", source: "manual", dueAt: "2026-09-20T23:59:00.000Z" }],
    grades: [], goals: [], resources: [],
  });
  const afterHydration = resolveAssignmentDetail(baseInput({ assignmentId: requestedId, localAssignments: hydrated.assignments }));
  assert.equal(afterHydration.state, "found");
  if (afterHydration.state !== "found") return;
  assert.equal(afterHydration.isLocal, true);
  assert.equal(afterHydration.assignment.id, requestedId);
  assert.equal(afterHydration.assignment.sourceType, "manual");
  assert.equal(afterHydration.assignment.title, "Excused Absence or Tardy Memorandum");
  assert.equal(afterHydration.assignment.dueAt?.toISOString(), "2026-09-20T23:59:00.000Z");
  assert.equal(afterHydration.assignment.priority, "high");
  assert.equal(afterHydration.assignment.description, "Memorandum details");
  assert.equal(afterHydration.courseIdentity?.id, course.id);
  const encodedRouteId = resolveAssignmentDetail(baseInput({ assignmentId: requestedId.replace(":", "%3A"), localAssignments: hydrated.assignments }));
  assert.equal(encodedRouteId.state, "found");
  if (encodedRouteId.state === "found") assert.equal(encodedRouteId.assignment.id, requestedId);
});

test("detail waits for both possible assignment sources before reporting not found", () => {
  assert.deepEqual(resolveAssignmentDetail(baseInput({ localReady: false })), { state: "loading" });
  assert.deepEqual(resolveAssignmentDetail(baseInput({ providerLoading: true })), { state: "loading" });
  assert.deepEqual(resolveAssignmentDetail(baseInput({ localReady: true, providerLoading: false })), { state: "not-found" });
});

test("provider assignment detail remains resolvable after data sources are ready", () => {
  const provider = assignment({ id: "canvas-api:818707:42", canvasUrl: "https://canvas.example/courses/818707/assignments/42" });
  const result = resolveAssignmentDetail(baseInput({ assignmentId: provider.id, providerAssignments: [provider] }));
  assert.equal(result.state, "found");
  if (result.state !== "found") return;
  assert.equal(result.assignment.id, provider.id);
  assert.equal(result.isLocal, false);
  assert.equal(result.assignment.canvasUrl, provider.canvasUrl);
  assert.equal(result.courseIdentity?.id, course.id);
});

test("mixed-course provider details resolve to the unified canonical local course", () => {
  const provider = assignment({ courseId: "818707" });
  const result = resolveAssignmentDetail(baseInput({ assignmentId: provider.id, providerAssignments: [provider] }));
  assert.equal(result.state, "found");
  if (result.state === "found") assert.equal(result.courseIdentity?.id, course.id);
});

test("detail resolves a reconciled provider projection by its canonical assignment ID", () => {
  const url = "https://canvas.example/courses/818707/assignments/42";
  const projections = dedupeSchoolAssignments([
    assignment({ id: "canvas-calendar:event-42", sourceType: "canvas-calendar", canvasUrl: url, title: "Calendar title" }),
    assignment({ id: "canvas-api:818707:42", sourceType: "canvas-api", canvasUrl: url, title: "Canonical title", completionStatus: "submitted" }),
  ]);
  const result = resolveAssignmentDetail(baseInput({ assignmentId: "canvas-api:818707:42", providerAssignments: projections }));
  assert.equal(result.state, "found");
  if (result.state === "found") {
    assert.equal(result.assignment.title, "Canonical title");
    assert.equal(result.assignment.completionStatus, "submitted");
  }
});

test("canonical course link uses unified Course Detail and unresolved courses remain unlinked", () => {
  const catalog = buildSchoolCourseCatalog([course], [term], [providerCourse]);
  assert.equal(assignmentDetailCourseHref(catalog[0]!), `/school/courses/${encodeURIComponent(course.id)}`);
  const unmatched = resolveAssignmentDetail(baseInput({ assignmentId: "unmatched", providerAssignments: [assignment({ id: "unmatched", courseId: "unknown-course", courseName: "Unknown" })] }));
  assert.equal(unmatched.state, "found");
  if (unmatched.state === "found") assert.equal(unmatched.courseIdentity, undefined);

  const other: Course = { ...course, id: "other-as1010", termId: "spring" };
  const ambiguous = resolveAssignmentDetail(baseInput({ courses: [course, other], providerCourses: [], assignmentId: "ambiguous", providerAssignments: [assignment({ id: "ambiguous", courseId: undefined, courseName: "AS 1010" })] }));
  assert.equal(ambiguous.state, "found");
  if (ambiguous.state === "found") assert.equal(ambiguous.courseIdentity, undefined);
});

test("assignment deleted after navigation becomes honestly not found after hydration", () => {
  const requestedId = "manual:deleted-after-click";
  assert.equal(resolveAssignmentDetail(baseInput({ assignmentId: requestedId, localReady: false })).state, "loading");
  assert.equal(resolveAssignmentDetail(baseInput({ assignmentId: requestedId, localReady: true, localAssignments: [] })).state, "not-found");
});
