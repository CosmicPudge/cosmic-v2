import type { Assignment, Course, CourseMeeting, SchoolTerm } from "@/core/contracts/School";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import type { SchoolEvent } from "@/components/school/data/types";
import { isAssignmentActiveForPlanning, isAssignmentOverdue } from "./planning";

export interface ProjectedCourseMeeting {
  id: string;
  course: Course;
  meeting: CourseMeeting;
  start: Date;
  end: Date;
}

export function localAssignmentToPlanning(item: Assignment, course?: Course): SchoolPlanningAssignment {
  const stamp = new Date(0);
  return { id: `manual:${item.id}`, accountId: "local", title: item.title, ...(item.description ? { description: item.description } : {}), ...(item.courseId ? { courseId: item.courseId, courseName: course?.name } : {}), sourceType: "manual", ...(item.dueAt ? { dueAt: item.dueAt } : {}), completionStatus: item.status === "completed" ? "completed" : "upcoming", planningStatus: item.status === "completed" ? "done" : "not_started", priority: item.priority === "high" ? "high" : item.priority === "low" ? "low" : "normal", createdAt: stamp, updatedAt: stamp };
}

function asDate(value: Date | string | undefined): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = dateOnly ? (() => { const [year, month, day] = value.split("-").map(Number); return new Date(year, month - 1, day); })() : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function startOfDay(date: Date): Date { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
function addDays(date: Date, days: number): Date { const result = new Date(date); result.setDate(result.getDate() + days); return result; }
function dayKey(date: Date): string { return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; }
function mondayOfWeek(date: Date): Date { const day = date.getDay(); return startOfDay(addDays(date, day === 0 ? -6 : 1 - day)); }
function timeParts(value: string): [number, number] | undefined {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return undefined;
  const hour = Number(match[1]); const minute = Number(match[2]);
  return hour >= 0 && hour < 24 && minute >= 0 && minute < 60 ? [hour, minute] : undefined;
}
function dateForMeeting(day: Date, time: string): Date | undefined {
  const parts = timeParts(time); if (!parts) return undefined;
  const result = new Date(day); result.setHours(parts[0], parts[1], 0, 0); return result;
}
function inTerm(date: Date, term?: SchoolTerm): boolean {
  const start = asDate(term?.startDate); const end = asDate(term?.endDate);
  return (!start || date >= startOfDay(start)) && (!end || date < addDays(startOfDay(end), 1));
}
function completed(item: SchoolPlanningAssignment): boolean { return !isAssignmentActiveForPlanning(item); }

export function projectCourseMeetings(courses: Course[], term: SchoolTerm | undefined, from: Date, days = 7): ProjectedCourseMeeting[] {
  const first = startOfDay(from);
  return courses.flatMap((course) => course.meetingTimes.flatMap((meeting) => Array.from({ length: days }, (_, offset) => {
    const date = addDays(first, offset); if (date.getDay() !== meeting.weekday || !inTerm(date, term)) return [];
    const start = dateForMeeting(date, meeting.startTime); const end = dateForMeeting(date, meeting.endTime);
    return start && end && end > start ? [{ id: `${course.id}:${dayKey(date)}:${meeting.startTime}`, course, meeting, start, end }] : [];
  })).flat());
}

export function getSchoolToday(courses: Course[], term: SchoolTerm | undefined, assignments: SchoolPlanningAssignment[], events: SchoolEvent[], now = new Date()) {
  const start = startOfDay(now); const end = addDays(start, 1);
  return { meetings: projectCourseMeetings(courses, term, start, 1), assignments: assignments.filter((item) => !completed(item) && item.dueAt && item.dueAt >= start && item.dueAt < end), events: events.filter((item) => item.type !== "class" && item.type !== "assignment" && item.start >= start && item.start < end) };
}

export function getNextClassToday(meetings: ProjectedCourseMeeting[], now = new Date()): ProjectedCourseMeeting | undefined {
  return meetings.filter((item) => item.start >= now).sort((a, b) => a.start.getTime() - b.start.getTime())[0];
}

export function getUpcomingAssignments(assignments: SchoolPlanningAssignment[], now = new Date(), days = 7): SchoolPlanningAssignment[] {
  const start = startOfDay(now); const end = addDays(start, days);
  return assignments.filter((item) => !completed(item) && item.dueAt && item.dueAt >= start && item.dueAt < end).sort((a, b) => a.dueAt!.getTime() - b.dueAt!.getTime() || a.title.localeCompare(b.title));
}

export function getOverdueAssignments(assignments: SchoolPlanningAssignment[], now = new Date()): SchoolPlanningAssignment[] {
  const today = startOfDay(now);
  return assignments.filter((item) => isAssignmentOverdue(item, today)).sort((a, b) => a.dueAt!.getTime() - b.dueAt!.getTime());
}

export function getSchoolWeek(courses: Course[], term: SchoolTerm | undefined, assignments: SchoolPlanningAssignment[], events: SchoolEvent[], now = new Date()) {
  const start = mondayOfWeek(now); const end = addDays(start, 7);
  return { start, end, meetings: projectCourseMeetings(courses, term, start, 7), assignments: getUpcomingAssignments(assignments, start, 7), events: events.filter((item) => item.start >= start && item.start < end && item.type !== "class" && item.type !== "assignment").sort((a, b) => a.start.getTime() - b.start.getTime()) };
}

export function getCourseNotes<T extends { courseId?: string }>(notes: T[], courseId: string): T[] { return notes.filter((note) => note.courseId === courseId); }
