import type { Course } from "@/core/contracts/School";
import type { SchoolPlanningAssignment, SchoolTimelineEntry } from "@/core/contracts/SchoolPlanning";
import type { LocalSchoolData } from "@/components/school/data/localRepository";
import type { SchoolCanvasCourse, SchoolSnapshot } from "./domain";
import type { SchoolCourseIdentity } from "./courseIdentity";
import { normalizeCourseIdentityCode, normalizeCourseName } from "./courseIdentity";

export type SchoolSetupState = "ready" | "partially_connected" | "not_connected" | "provider_error";

export function getSchoolSetupState(local: Pick<LocalSchoolData, "terms" | "courses" | "assignments">, snapshot: Pick<SchoolSnapshot, "sourceStatus" | "canvasCourses" | "planningAssignments" | "events"> | null | undefined): SchoolSetupState {
  const hasLocalData = local.terms.length > 0 || local.courses.length > 0 || local.assignments.length > 0;
  const hasProviderData = Boolean(snapshot?.sourceStatus?.canvas === "healthy" || snapshot?.canvasCourses?.length || snapshot?.planningAssignments?.length || snapshot?.events?.length);
  const providerError = snapshot?.sourceStatus?.canvas === "error";
  if (providerError) return "provider_error";
  if (hasLocalData) return "ready";
  if (hasProviderData) return "partially_connected";
  return "not_connected";
}

function identityValues(identity: SchoolCourseIdentity) {
  return new Set([identity.name, identity.code].map(normalizeCourseName).filter((value): value is string => Boolean(value)));
}

export function assignmentBelongsToCourse(assignment: Pick<SchoolPlanningAssignment, "courseId" | "courseName">, identity: SchoolCourseIdentity, localCourse?: Course): boolean {
  if (assignment.courseId && (assignment.courseId === identity.localCourseId || identity.providerCourseIds.includes(assignment.courseId))) return true;
  const values = identityValues(identity);
  const normalized = normalizeCourseName(assignment.courseName);
  if (normalized && values.has(normalized)) return true;
  if (localCourse?.code && normalizeCourseIdentityCode(assignment.courseName) === normalizeCourseIdentityCode(localCourse.code)) return true;
  return false;
}

export function timelineEntryBelongsToCourse(entry: Pick<SchoolTimelineEntry, "courseName" | "sourceId">, identity: SchoolCourseIdentity): boolean {
  if (entry.sourceId && (entry.sourceId === identity.localCourseId || identity.providerCourseIds.includes(entry.sourceId))) return true;
  const normalized = normalizeCourseName(entry.courseName);
  return Boolean(normalized && identityValues(identity).has(normalized));
}

export function resolveCalendarCourseFilter(requestedCourseId: string | null | undefined, catalog: SchoolCourseIdentity[]): string {
  if (!requestedCourseId) return "all";
  return catalog.some((identity) => identity.id === requestedCourseId) ? requestedCourseId : "all";
}

export function providerCourseLabel(identity: SchoolCourseIdentity, provider?: SchoolCanvasCourse): string {
  if (provider) return provider.courseCode ? `Canvas · ${provider.courseCode}` : "Canvas course";
  return identity.sources.includes("canvas-api") ? "Canvas-connected" : "Manual course";
}
