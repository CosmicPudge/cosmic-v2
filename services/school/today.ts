import type { Course, SchoolTerm } from "@/core/contracts/School";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import type { SchoolEvent } from "@/components/school/data/types";
import { buildSchoolCourseCatalog, type SchoolCourseIdentity } from "./courseIdentity";
import { dedupeSchoolAssignments } from "./assignmentIdentity";
import { isAssignmentActiveForPlanning } from "./planning";
import { rankSchoolAssignments } from "./planning";
import { assignmentBelongsToCourse } from "./courseExperience";
import { normalizeCourseName } from "./courseIdentity";
import { getOverdueAssignments, getSchoolToday, getUpcomingAssignments, projectCourseMeetings } from "./semesterConsumers";

export type TodayScheduleItem =
  | { kind: "class"; id: string; start: Date; end: Date; course: Course; location?: string }
  | { kind: "event"; id: string; start: Date; end: Date; title: string; courseId?: string; courseName?: string; location?: string; source: SchoolEvent["source"] };

export function resolveTodayAssignmentCourseId(assignment: SchoolPlanningAssignment, catalog: SchoolCourseIdentity[], courses: Course[]): string | undefined {
  const matches = catalog.filter((identity) => assignmentBelongsToCourse(assignment, identity, identity.localCourseId ? courses.find((course) => course.id === identity.localCourseId) : undefined));
  return matches.length === 1 ? matches[0].id : undefined;
}

export function resolveTodayEventCourseId(event: Pick<SchoolEvent, "courseId" | "course">, catalog: SchoolCourseIdentity[]): string | undefined {
  if (event.courseId) {
    const exact = catalog.filter((identity) => identity.id === event.courseId || identity.localCourseId === event.courseId || identity.providerCourseIds.includes(event.courseId!));
    return exact.length === 1 ? exact[0].id : undefined;
  }
  const name = normalizeCourseName(event.course);
  if (!name) return undefined;
  const matches = catalog.filter((identity) => name === normalizeCourseName(identity.name) || name === normalizeCourseName(identity.code));
  return matches.length === 1 ? matches[0].id : undefined;
}

export function buildTodayAcademicView(input: {
  courses: Course[];
  term?: SchoolTerm;
  catalog?: SchoolCourseIdentity[];
  assignments: SchoolPlanningAssignment[];
  events: SchoolEvent[];
  now: Date;
}) {
  const assignments = dedupeSchoolAssignments(input.assignments);
  const activeAssignments = assignments.filter(isAssignmentActiveForPlanning);
  const today = getSchoolToday(input.courses, input.term, activeAssignments, input.events, input.now);
  const catalog = input.catalog ?? buildSchoolCourseCatalog(input.courses, input.term ? [input.term] : []);
  const dayStart = new Date(input.now.getFullYear(), input.now.getMonth(), input.now.getDate());
  const tomorrow = new Date(dayStart); tomorrow.setDate(tomorrow.getDate() + 1);
  const meetings = projectCourseMeetings(input.courses, input.term, input.now, 8);
  const calendarEventsToday = input.events.filter((item) => item.type !== "assignment" && item.start >= dayStart && item.start < tomorrow);
  const schedule: TodayScheduleItem[] = [
    ...today.meetings.map((item): TodayScheduleItem => ({ kind: "class", id: item.id, start: item.start, end: item.end, course: item.course, ...(item.meeting.location ?? item.course.location ? { location: item.meeting.location ?? item.course.location } : {}) })),
    ...calendarEventsToday.filter((event) => {
      if (event.type !== "class") return true;
      const eventCourseId = resolveTodayEventCourseId({ courseId: event.courseId, course: event.course }, catalog);
      if (!eventCourseId) return true;
      return !today.meetings.some((meeting) => {
        const localCourseIdentity = catalog.find((identity) => identity.localCourseId === meeting.course.id);
        return localCourseIdentity?.id === eventCourseId && meeting.start.getTime() === event.start.getTime() && meeting.end.getTime() === event.end.getTime();
      });
    }).map((item): TodayScheduleItem => ({ kind: "event", id: `${item.source}:${item.id}`, start: item.start, end: item.end, title: item.title, ...(item.courseId ? { courseId: item.courseId } : {}), ...(item.course ? { courseName: item.course } : {}), ...(item.location ? { location: item.location } : {}), source: item.source })),
  ].sort((left, right) => left.start.getTime() - right.start.getTime() || left.id.localeCompare(right.id));
  const upcomingAssignments = getUpcomingAssignments(activeAssignments, input.now, 7).filter((item) => item.dueAt!.toDateString() !== input.now.toDateString());
  const overdueAssignments = getOverdueAssignments(activeAssignments, input.now);
  const comingEvents = input.events.filter((item) => item.type !== "class" && item.type !== "assignment" && item.start > input.now && item.start < new Date(input.now.getFullYear(), input.now.getMonth(), input.now.getDate() + 8)).sort((left, right) => left.start.getTime() - right.start.getTime());
  const nextAssignment = rankSchoolAssignments(activeAssignments, input.now)[0];
  const nextMeeting = meetings.filter((item) => item.start > input.now).sort((left, right) => left.start.getTime() - right.start.getTime())[0];
  const nextEvent = comingEvents[0];
  const nextScheduleItem = [nextMeeting && { kind: "class" as const, start: nextMeeting.start, course: nextMeeting.course }, nextEvent && { kind: "event" as const, start: nextEvent.start, title: nextEvent.title }].filter((item): item is NonNullable<typeof item> => Boolean(item)).sort((left, right) => left.start.getTime() - right.start.getTime())[0];
  return {
    assignments,
    overdueAssignments,
    dueTodayAssignments: today.assignments.filter((item) => !getOverdueAssignments([item], input.now).length),
    upcomingAssignments,
    comingEvents,
    schedule,
    nextAssignment: nextAssignment ? assignments.find((item) => item.id === nextAssignment.assignmentId) : undefined,
    nextScheduleItem,
  };
}
