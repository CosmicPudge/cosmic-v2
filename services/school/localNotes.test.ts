import assert from "node:assert/strict";
import test from "node:test";
import type { Course } from "@/core/contracts/School";
import { emptyLocalSchoolData, normalizeLocalSchoolData, type LocalSchoolNote } from "@/components/school/data/localDataHydration";
import { resolveLocalCourseFilter } from "./localStudy";
import { deleteLocalSchoolNote, filterLocalSchoolNotes, getSchoolNotesStorageMode, saveLocalSchoolNote } from "./localNotes";

const course: Course = { id: "as-1010", code: "AS 1010", name: "Heritage and Values", termId: "fall", meetingTimes: [] };
const otherCourse: Course = { id: "bio-1010", code: "BIO 1010", name: "Biology", termId: "fall", meetingTimes: [] };
const createdAt = new Date("2026-09-18T15:00:00.000Z");
const note: LocalSchoolNote = { id: "note-1", title: "Lecture notes", content: "Review the assigned reading.", courseId: course.id, topics: ["reading"], createdAt, updatedAt: createdAt };
const base = { ...emptyLocalSchoolData, courses: [course, otherCourse] };

test("personal and local notes stay in the local School repository while account scope retains server mode", () => {
  assert.equal(getSchoolNotesStorageMode("personal"), "local");
  assert.equal(getSchoolNotesStorageMode("local"), "local");
  assert.equal(getSchoolNotesStorageMode("account"), "account");
});

test("local notes create, edit, validate exact course association, and delete", () => {
  const created = saveLocalSchoolNote(base, note, createdAt);
  assert.equal("error" in created, false);
  if ("error" in created) return;
  assert.deepEqual(created.data.notes, [note]);

  const editedAt = new Date("2026-09-19T15:00:00.000Z");
  const edited = saveLocalSchoolNote(created.data, { ...note, title: "Updated lecture notes", content: "Updated content.", courseId: otherCourse.id }, editedAt);
  assert.equal("error" in edited, false);
  if ("error" in edited) return;
  assert.equal(edited.note.title, "Updated lecture notes");
  assert.equal(edited.note.courseId, otherCourse.id);
  assert.equal(edited.note.createdAt, createdAt);
  assert.equal(edited.note.updatedAt, editedAt);
  assert.equal("error" in saveLocalSchoolNote(base, { ...note, courseId: "missing-course" }), true);
  assert.equal("error" in saveLocalSchoolNote({ ...base, courses: [course, { ...course }] }, note), true);
  assert.equal(deleteLocalSchoolNote(edited.data, note.id).notes?.length, 0);
});

test("course note list is exact, All Notes includes general notes, invalid context is empty, and Add Note default is safe", () => {
  const other: LocalSchoolNote = { ...note, id: "note-2", courseId: otherCourse.id };
  const general: LocalSchoolNote = { ...note, id: "note-3", courseId: undefined };
  const notes = [note, other, general];
  assert.deepEqual(filterLocalSchoolNotes(notes, course.id).map((item) => item.id), [note.id]);
  assert.deepEqual(filterLocalSchoolNotes(notes).map((item) => item.id), [note.id, other.id, general.id]);
  assert.deepEqual(filterLocalSchoolNotes(notes, "missing-course"), []);
  assert.equal(resolveLocalCourseFilter(course.id, base.courses).course?.id, course.id);
  assert.equal(resolveLocalCourseFilter("missing-course", base.courses).course, undefined);
  assert.equal(resolveLocalCourseFilter(course.id, [course, { ...course }]).course, undefined);
});

test("local note create/update survives a JSON persistence round trip", () => {
  const saved = saveLocalSchoolNote(base, note, createdAt);
  assert.equal("error" in saved, false);
  if ("error" in saved) return;
  const reloaded = normalizeLocalSchoolData(JSON.parse(JSON.stringify(saved.data)));
  assert.equal(reloaded.notes?.length, 1);
  assert.equal(reloaded.notes?.[0]?.id, note.id);
  assert.equal(reloaded.notes?.[0]?.courseId, course.id);
  assert.ok(reloaded.notes?.[0]?.createdAt instanceof Date);
  assert.equal(reloaded.notes?.[0]?.createdAt.toISOString(), createdAt.toISOString());
});
