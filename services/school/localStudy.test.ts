import assert from "node:assert/strict";
import test from "node:test";
import type { Course, SchoolResource } from "@/core/contracts/School";
import { emptyLocalSchoolData, normalizeLocalSchoolData, type LocalSchoolDataShape, type LocalStudyCard, type LocalStudySet } from "@/components/school/data/localDataHydration";
import { parseBulkCards } from "./studyBulk";
import { deleteLocalResource, deleteLocalStudyCard, deleteLocalStudySet, filterLocalResources, getLocalStudyQueue, getLocalStudySetStats, getLocalStudySetsForCourse, resolveLocalCourseFilter, saveLocalResource, saveLocalStudyCards, saveLocalStudySet, studyCourseHref, reviewLocalStudyCard } from "./localStudy";

const now = new Date("2026-09-18T12:00:00.000Z");
const course: Course = { id: "local-as1010", code: "AS 1010", name: "Heritage and Values", termId: "fall", meetingTimes: [] };
const otherCourse: Course = { ...course, id: "local-other", code: "BIO 1010", name: "Biology" };
const base: LocalSchoolDataShape = { ...emptyLocalSchoolData, courses: [course, otherCourse] };
const set: LocalStudySet = { id: "set-1", title: "Heritage terms", courseId: course.id, createdAt: now, updatedAt: now };
const card = (overrides: Partial<LocalStudyCard> = {}): LocalStudyCard => ({ id: "card-1", setId: set.id, front: "Front", back: "Back", reviewCount: 0, intervalDays: 0, lastReviewedAt: null, nextReviewAt: null, createdAt: now, updatedAt: now, ...overrides });

test("creates and edits a local set with stable metadata and canonical course association", () => {
  const created = saveLocalStudySet(base, { id: set.id, title: "  Heritage terms ", description: " Course review ", courseId: course.id }, now);
  assert.equal("error" in created, false);
  if ("error" in created) return;
  assert.equal(created.set.title, "Heritage terms");
  assert.equal(created.set.courseId, course.id);
  const edited = saveLocalStudySet(created.data, { id: set.id, title: "Exam review", courseId: otherCourse.id }, new Date(now.getTime() + 1_000));
  assert.equal("error" in edited, false);
  if ("error" in edited) return;
  assert.equal(edited.set.createdAt, now);
  assert.equal(edited.set.courseId, otherCourse.id);
  assert.equal(edited.set.description, undefined);
  assert.equal(saveLocalStudySet(base, { id: "bad", title: "  " }).error, "Study set title is required.");
  assert.equal(saveLocalStudySet(base, { id: "bad", title: "No course", courseId: "not-local" }).error, "Choose a course from your local School courses.");
  const general = saveLocalStudySet(base, { id: "general", title: "General" }, now);
  assert.equal("error" in general, false);
  if (!("error" in general)) assert.equal(general.set.courseId, undefined);
});

test("creates, edits, rejects invalid cards, and deletes cards and sets without touching resources", () => {
  const withSet = saveLocalStudySet(base, set, now);
  assert.equal("error" in withSet, false);
  if ("error" in withSet) return;
  const first = saveLocalStudyCards(withSet.data, [{ id: "card-1", setId: set.id, front: "Q", back: "A" }], now);
  assert.equal("error" in first, false);
  if ("error" in first) return;
  const edit = saveLocalStudyCards(first.data, [{ id: "card-1", setId: set.id, front: "Updated Q", back: "Updated A" }], new Date(now.getTime() + 1_000));
  assert.equal("error" in edit, false);
  if ("error" in edit) return;
  assert.equal(edit.data.flashcards?.length, 1);
  assert.equal(edit.data.flashcards?.[0]?.front, "Updated Q");
  assert.equal(edit.data.flashcards?.[0]?.createdAt, now);
  assert.equal(saveLocalStudyCards(edit.data, [{ id: "empty-front", setId: set.id, front: " ", back: "A" }]).error, "Every card needs a front.");
  assert.equal(saveLocalStudyCards(edit.data, [{ id: "empty-back", setId: set.id, front: "Q", back: " " }]).error, "Every card needs a back.");
  assert.equal(saveLocalStudyCards(edit.data, [{ id: "orphan", setId: "missing", front: "Q", back: "A" }]).error, "Study set not found.");
  const resource: SchoolResource = { id: "resource", title: "Reference", category: "course", courseId: course.id };
  const withResource = { ...edit.data, resources: [resource] };
  assert.equal(deleteLocalStudyCard(withResource, "card-1").flashcards?.length, 0);
  const deletedSet = deleteLocalStudySet(withResource, set.id);
  assert.equal(deletedSet.studySets?.length, 0);
  assert.equal(deletedSet.flashcards?.length, 0);
  assert.deepEqual(deletedSet.resources, [resource]);
  assert.deepEqual(deletedSet.courses, base.courses);
});

test("review queue includes reviewed due cards then new cards and rating updates are deterministic", () => {
  const due = card({ id: "due", reviewCount: 1, intervalDays: 1, lastReviewedAt: new Date(now.getTime() - 86_400_000), nextReviewAt: now });
  const future = card({ id: "future", reviewCount: 1, intervalDays: 3, lastReviewedAt: now, nextReviewAt: new Date(now.getTime() + 86_400_000) });
  const fresh = card({ id: "fresh" });
  assert.deepEqual(getLocalStudyQueue([due, future, fresh], now).map((item) => item.id), ["due", "fresh"]);
  assert.deepEqual(getLocalStudySetStats(set.id, [due, future, fresh], now), { total: 3, new: 1, due: 1 });
  const withSet = saveLocalStudySet(base, set, now);
  if ("error" in withSet) return;
  for (const [rating, expectedInterval] of [["again", 0], ["hard", 1], ["good", 1], ["easy", 2]] as const) {
    const result = reviewLocalStudyCard({ ...withSet.data, flashcards: [card()] }, "card-1", rating, now);
    assert.equal("error" in result, false);
    if (!("error" in result)) {
      assert.equal(result.card.reviewCount, 1);
      assert.equal(result.card.intervalDays, expectedInterval);
      assert.equal(result.card.lastReviewedAt, now);
      assert.equal(result.card.nextReviewAt?.getTime(), now.getTime() + (rating === "again" ? 10 * 60_000 : expectedInterval * 86_400_000));
    }
  }
  const reviewed = reviewLocalStudyCard({ ...withSet.data, flashcards: [card()] }, "card-1", "good", now);
  if (!("error" in reviewed)) {
    const restored = normalizeLocalSchoolData(JSON.parse(JSON.stringify(reviewed.data)));
    assert.equal(restored.flashcards?.[0]?.reviewCount, 1);
    assert.equal(restored.flashcards?.[0]?.intervalDays, 1);
    assert.equal(restored.flashcards?.[0]?.lastReviewedAt?.toISOString(), now.toISOString());
    assert.equal(restored.flashcards?.[0]?.nextReviewAt?.toISOString(), new Date(now.getTime() + 86_400_000).toISOString());
  }
});

test("bulk entry saves valid parsed rows once and reports malformed rows separately", () => {
  const withSet = saveLocalStudySet(base, set, now);
  assert.equal("error" in withSet, false);
  if ("error" in withSet) return;
  const parsed = parseBulkCards("First question\tFirst answer\nmalformed row\nSecond question | Second answer");
  assert.equal(parsed.cards.length, 2);
  assert.deepEqual(parsed.invalidRows.map((row) => row.line), [2]);
  const saved = saveLocalStudyCards(withSet.data, parsed.cards.map((item, index) => ({ id: `bulk-${index}`, setId: set.id, ...item })), now);
  assert.equal("error" in saved, false);
  if (!("error" in saved)) assert.deepEqual(saved.data.flashcards?.map((item) => item.front), ["First question", "Second question"]);
});

test("JSON serialization and hydration preserve local Study dates and all existing School collections", () => {
  const studyCard = card({ lastReviewedAt: now, nextReviewAt: new Date("2026-09-20T12:00:00.000Z"), reviewCount: 3, intervalDays: 2 });
  const original: LocalSchoolDataShape = { ...base, terms: [{ id: "fall", name: "Fall", startDate: now }], assignments: [{ id: "assignment", title: "Essay", status: "upcoming", priority: "medium", dueAt: now, source: "manual" }], resources: [{ id: "resource", title: "Textbook", category: "course", courseId: course.id }], studySets: [set], flashcards: [studyCard] };
  const roundTrip = normalizeLocalSchoolData(JSON.parse(JSON.stringify(original)));
  assert.ok(roundTrip.studySets?.[0]?.createdAt instanceof Date);
  assert.ok(roundTrip.flashcards?.[0]?.lastReviewedAt instanceof Date);
  assert.ok(roundTrip.flashcards?.[0]?.nextReviewAt instanceof Date);
  assert.equal(roundTrip.flashcards?.[0]?.reviewCount, 3);
  assert.equal(roundTrip.assignments[0]?.dueAt instanceof Date, true);
  assert.equal(roundTrip.resources[0]?.title, "Textbook");
  assert.equal(roundTrip.courses[0]?.id, course.id);
  assert.equal(roundTrip.terms[0]?.startDate instanceof Date, true);
  assert.equal(roundTrip.flashcards?.[0]?.nextReviewAt?.toISOString(), "2026-09-20T12:00:00.000Z");
});

test("old snapshots and malformed optional Study collections hydrate safely", () => {
  const oldSnapshot = normalizeLocalSchoolData({ ...base, studySets: undefined, flashcards: undefined });
  assert.deepEqual(oldSnapshot.studySets, []);
  assert.deepEqual(oldSnapshot.flashcards, []);
  const malformed = normalizeLocalSchoolData({ ...base, studySets: [{ id: "valid", title: "Valid", createdAt: now }, { id: "bad", title: 4 }], flashcards: [{ id: "bad-card", setId: "missing", front: "Q", back: "A" }, { id: "card", setId: "valid", front: "Q", back: "A", reviewCount: -3, intervalDays: "bad", nextReviewAt: "not-a-date", lastReviewedAt: "invalid" }] });
  assert.equal(malformed.studySets?.length, 1);
  assert.equal(malformed.flashcards?.length, 1);
  assert.equal(malformed.flashcards?.[0]?.reviewCount, 0);
  assert.equal(malformed.flashcards?.[0]?.intervalDays, 0);
  assert.equal(malformed.flashcards?.[0]?.nextReviewAt, null);
  assert.equal(malformed.flashcards?.[0]?.lastReviewedAt, null);
  assert.equal(malformed.courses[0]?.id, course.id);
});

test("course filter, course set list, resource filter, and Course → Study link stay canonical", () => {
  const sets = [set, { ...set, id: "other-set", courseId: otherCourse.id }, { ...set, id: "general-set", courseId: undefined }];
  assert.deepEqual(getLocalStudySetsForCourse(sets, course.id).map((item) => item.id), [set.id]);
  assert.equal(resolveLocalCourseFilter(course.id, [course, otherCourse]).course?.id, course.id);
  const addResourceCourse = resolveLocalCourseFilter(course.id, [course, otherCourse]).course;
  assert.equal(addResourceCourse?.id, course.id);
  assert.equal(resolveLocalCourseFilter(course.id, [course, { ...course }]).course, undefined);
  assert.equal(resolveLocalCourseFilter("missing", [course, otherCourse]).invalid, true);
  const resources: SchoolResource[] = [{ id: "r1", title: "AS resource", category: "course", courseId: course.id }, { id: "r2", title: "Other resource", category: "course", courseId: otherCourse.id }, { id: "r3", title: "General", category: "academic" }];
  assert.deepEqual(filterLocalResources(resources, course.id).map((item) => item.id), ["r1"]);
  assert.deepEqual(filterLocalResources(resources).map((item) => item.id), ["r1", "r2", "r3"]);
  const invalidFilter = resolveLocalCourseFilter("missing", [course, otherCourse]);
  assert.deepEqual(filterLocalResources(resources, invalidFilter.course?.id).map((item) => item.id), ["r1", "r2", "r3"]);
  assert.equal(studyCourseHref(course.id), `/school/study?course=${encodeURIComponent(course.id)}`);
});

test("local resource create, edit, delete, and Study links remain separate from flashcards", () => {
  const resource: SchoolResource = { id: "r1", title: "Course text", category: "course", courseId: course.id };
  const created = saveLocalResource(base, resource);
  const edited = saveLocalResource(created, { ...resource, title: "Updated text" });
  assert.equal(edited.resources.length, 1);
  assert.equal(edited.resources[0]?.title, "Updated text");
  assert.deepEqual(edited.flashcards, []);
  assert.equal(deleteLocalResource(edited, resource.id).resources.length, 0);
});
