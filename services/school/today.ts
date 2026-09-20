import type { Course, SchoolTerm } from "@/core/contracts/School";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import type { SchoolEvent } from "@/components/school/data/types";
import type { LocalStudyCard, LocalStudySet } from "@/components/school/data/localDataHydration";
import type { SchoolPlanRecommendation } from "@/core/contracts/SchoolPlanning";
import { buildSchoolCourseCatalog, type SchoolCourseIdentity } from "./courseIdentity";
import { dedupeSchoolAssignments } from "./assignmentIdentity";
import { isAssignmentActiveForPlanning, rankSchoolAssignments } from "./planning";
import { assignmentBelongsToCourse } from "./courseExperience";
import { normalizeCourseName } from "./courseIdentity";
import { buildAssignmentWorkload } from "./assignmentWorkload";
import { getSchoolToday, projectCourseMeetings } from "./semesterConsumers";
import { isCardDue } from "./studyReview";

export type TodayScheduleItem =
  | { kind: "class"; id: string; start: Date; end: Date; course: Course; location?: string }
  | { kind: "event"; id: string; start: Date; end: Date; title: string; courseId?: string; courseName?: string; location?: string; allDay?: boolean; source: SchoolEvent["source"] };

export interface TodayStudyReview { setId: string; title: string; dueCount: number; courseName?: string; }

export type TodayNextStep =
  | { kind: "attention"; item: SchoolPlanningAssignment }
  | { kind: "deadline"; item: SchoolPlanningAssignment }
  | { kind: "planner"; item: SchoolPlanningAssignment; reason: string }
  | { kind: "study"; review: TodayStudyReview }
  | undefined;

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
  studySets?: LocalStudySet[];
  flashcards?: LocalStudyCard[];
  planningRecommendations?: SchoolPlanRecommendation[];
  providerUnavailable?: boolean;
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
  const workload = buildAssignmentWorkload({ assignments, catalog, courses: input.courses, filters: { status: "all", source: "all", search: "" }, now: input.now });
  const todayIds = new Set(today.assignments.map((item) => item.id));
  const dueTodayAssignments = today.assignments;
  const overdueAssignments = workload.groups.needsAttention;
  const needsAttentionAssignments = [...new Map([...overdueAssignments, ...dueTodayAssignments].map((item) => [item.id, item])).values()].sort((left, right) => (left.dueAt?.getTime() ?? 0) - (right.dueAt?.getTime() ?? 0) || left.title.localeCompare(right.title) || left.id.localeCompare(right.id));
  const dueSoonAssignments = workload.groups.dueSoon.filter((item) => !todayIds.has(item.id));
  const datedAssignments = assignments.filter((item) => isAssignmentActiveForPlanning(item) && item.dueAt instanceof Date && Number.isFinite(item.dueAt.getTime()));
  const firstAttention = needsAttentionAssignments[0];
  const nextDeadline = [...datedAssignments].sort((left, right) => left.dueAt!.getTime() - right.dueAt!.getTime() || left.title.localeCompare(right.title) || left.id.localeCompare(right.id))[0];
  const activeById = new Map(assignments.filter(isAssignmentActiveForPlanning).map((item) => [item.id, item]));
  const planned = (input.planningRecommendations ?? []).map((recommendation) => ({ recommendation, item: activeById.get(recommendation.assignmentId) })).find((entry) => entry.item);
  const fallbackPlan = planned ?? rankSchoolAssignments(assignments, input.now).map((recommendation) => ({ recommendation, item: activeById.get(recommendation.assignmentId) })).find((entry) => entry.item);
  const cards = input.flashcards ?? [];
  const sets = input.studySets ?? [];
  const studyReviews: TodayStudyReview[] = sets.flatMap((set) => {
    const dueCount = cards.filter((card) => card.setId === set.id && card.lastReviewedAt && isCardDue(card, input.now)).length;
    if (!dueCount) return [];
    const matchedCourses = input.courses.filter((course) => course.id === set.courseId);
    return [{ setId: set.id, title: set.title, dueCount, ...(matchedCourses.length === 1 ? { courseName: matchedCourses[0].code ? `${matchedCourses[0].code} · ${matchedCourses[0].name}` : matchedCourses[0].name } : {}) }];
  }).sort((left, right) => right.dueCount - left.dueCount || left.title.localeCompare(right.title) || left.setId.localeCompare(right.setId));
  const nextStep: TodayNextStep = firstAttention ? { kind: "attention", item: firstAttention }
    : nextDeadline ? { kind: "deadline", item: nextDeadline }
      : fallbackPlan?.item ? { kind: "planner", item: fallbackPlan.item, reason: fallbackPlan.item.dueAt ? fallbackPlan.recommendation.reason : "No due date recorded" }
        : studyReviews[0] ? { kind: "study", review: studyReviews[0] } : undefined;
  const comingEnd = new Date(dayStart); comingEnd.setDate(comingEnd.getDate() + 8);
  const futureMeetings = meetings.filter((item) => item.start >= tomorrow && item.start < comingEnd).map((item): TodayScheduleItem => ({ kind: "class", id: item.id, start: item.start, end: item.end, course: item.course, ...(item.meeting.location ?? item.course.location ? { location: item.meeting.location ?? item.course.location } : {}) }));
  const futureEvents = input.events.filter((item) => item.type !== "assignment" && item.start >= tomorrow && item.start < comingEnd).filter((event) => {
    if (event.type !== "class") return true;
    const eventCourseId = resolveTodayEventCourseId({ courseId: event.courseId, course: event.course }, catalog);
    if (!eventCourseId) return true;
    return !futureMeetings.some((meeting) => meeting.kind === "class" && catalog.find((identity) => identity.localCourseId === meeting.course.id)?.id === eventCourseId && meeting.start.getTime() === event.start.getTime() && meeting.end.getTime() === event.end.getTime());
  }).map((item): TodayScheduleItem => ({ kind: "event", id: `${item.source}:${item.id}`, start: item.start, end: item.end, title: item.title, ...(item.courseId ? { courseId: item.courseId } : {}), ...(item.course ? { courseName: item.course } : {}), ...(item.location ? { location: item.location } : {}), ...(item.allDay ? { allDay: true } : {}), source: item.source }));
  const comingSchedule = [...futureMeetings, ...futureEvents].sort((left, right) => left.start.getTime() - right.start.getTime() || left.id.localeCompare(right.id));
  const comingUpAssignments = dueSoonAssignments.filter((item) => nextStep?.kind !== "deadline" || item.id !== nextStep.item.id);
  return {
    assignments,
    overdueAssignments,
    dueTodayAssignments,
    needsAttentionAssignments,
    dueSoonAssignments,
    comingUpAssignments,
    studyReviews,
    totalStudyReviewsDue: studyReviews.reduce((sum, item) => sum + item.dueCount, 0),
    comingSchedule,
    schedule,
    nextStep,
    providerUnavailable: input.providerUnavailable ?? false,
  };
}
