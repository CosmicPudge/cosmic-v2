import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import type { Course, SchoolTerm } from "@/core/contracts/School";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import { getCourseNotes, getNextClassToday, getOverdueAssignments, getSchoolToday, getSchoolWeek, getUpcomingAssignments, projectCourseMeetings } from "./semesterConsumers";

const now = new Date(2026, 8, 2, 10, 0);
const term: SchoolTerm = { id: "term", name: "Fall", startDate: new Date(2026, 7, 24), endDate: new Date(2026, 11, 18) };
const course: Course = { id: "course", code: "ENGR 1010", name: "Engineering", termId: "term", meetingTimes: [{ weekday: 3, startTime: "12:30", endTime: "13:30", location: "Hall" }] };
const assignment = (id: string, dueAt: Date, extra: Partial<SchoolPlanningAssignment> = {}): SchoolPlanningAssignment => ({ id, accountId: "account", title: id, dueAt, sourceType: "manual", completionStatus: "upcoming", planningStatus: "not_started", priority: "normal", createdAt: now, updatedAt: now, ...extra });

describe("semester consumers", () => {
  it("projects recurring meetings within the semester and selects the next class today", () => {
    const meetings = projectCourseMeetings([course], term, now, 7);
    assert.equal(meetings.length, 1);
    assert.equal(meetings[0].start.getHours(), 12);
    assert.equal(getNextClassToday(meetings, now)?.course.id, "course");
    assert.equal(getNextClassToday(meetings, new Date(2026, 8, 2, 14, 0)), undefined);
  });

  it("keeps meetings outside semester boundaries out of the projection", () => {
    assert.equal(projectCourseMeetings([course], { ...term, endDate: new Date(2026, 8, 1) }, now, 7).length, 0);
  });

  it("sorts the next seven days and excludes completed work", () => {
    const items = getUpcomingAssignments([assignment("later", new Date(2026, 8, 5, 9), {}), assignment("today", new Date(2026, 8, 2, 23, 59)), assignment("done", new Date(2026, 8, 2, 8), { completionStatus: "completed" })], now);
    assert.deepEqual(items.map((item) => item.id), ["today", "later"]);
    assert.deepEqual(getSchoolToday([], term, items, [], now).assignments.map((item) => item.id), ["today"]);
  });

  it("surfaces overdue incomplete work but not completed work", () => {
    assert.deepEqual(getOverdueAssignments([assignment("old", new Date(2026, 8, 1, 23, 59)), assignment("done", new Date(2026, 8, 1), { completionStatus: "graded" })], now).map((item) => item.id), ["old"]);
  });

  it("projects a Monday-to-Sunday local week", () => {
    const week = getSchoolWeek([course], term, [], [], now);
    assert.equal(week.start.getDay(), 1);
    assert.equal(week.end.getDay(), 1);
  });

  it("filters general notes out of course notes", () => {
    assert.deepEqual(getCourseNotes([{ id: "one", courseId: "course" }, { id: "general" }], "course").map((item) => item.id), ["one"]);
  });
});
