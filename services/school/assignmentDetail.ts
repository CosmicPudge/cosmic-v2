import type { Assignment, Course, SchoolTerm } from "@/core/contracts/School";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import { localAssignmentToPlanning } from "./semesterConsumers";
import { buildSchoolCourseCatalog, type SchoolCourseIdentity } from "./courseIdentity";
import { resolveAssignmentCourse } from "./assignmentWorkload";
import type { SchoolCanvasCourse } from "./domain";

export function assignmentDetailHref(assignmentId: string) {
  return `/school/assignments/${encodeURIComponent(assignmentId)}`;
}

export function assignmentDetailCourseHref(identity: SchoolCourseIdentity) {
  return `/school/courses/${encodeURIComponent(identity.id)}`;
}

function normalizeAssignmentRouteId(value: string) {
  // Next.js may supply either an already-decoded parameter or an encoded
  // pathname segment. Decode at most once (malformed %-escapes remain literal).
  try { return decodeURIComponent(value); } catch { return value; }
}

export type AssignmentDetailResolution =
  | { state: "loading" }
  | { state: "not-found" }
  | { state: "found"; assignment: SchoolPlanningAssignment; isLocal: boolean; courseIdentity?: SchoolCourseIdentity };

export function resolveAssignmentDetail(input: {
  assignmentId: string;
  localReady: boolean;
  providerLoading: boolean;
  localAssignments: Assignment[];
  courses: Course[];
  terms: SchoolTerm[];
  providerCourses: SchoolCanvasCourse[];
  providerAssignments: SchoolPlanningAssignment[];
}): AssignmentDetailResolution {
  if (!input.localReady || input.providerLoading) return { state: "loading" };

  const assignmentId = normalizeAssignmentRouteId(input.assignmentId);
  const isManualRoute = assignmentId.startsWith("manual:");
  const localId = isManualRoute ? assignmentId.slice("manual:".length) : assignmentId;
  const localAssignment = input.localAssignments.find((assignment) => assignment.id === localId);
  const providerAssignment = input.providerAssignments.find((assignment) => {
    if (assignment.id === assignmentId) return true;
    // Personal Canvas feeds can carry their provider prefix within the UID.
    // Compare the exact external event UID only within the Canvas namespace.
    if (!assignmentId.startsWith("canvas-calendar:") || assignment.sourceType !== "canvas-calendar") return false;
    const routeUid = assignmentId.slice("canvas-calendar:".length);
    return assignment.externalId === routeUid ||
      assignment.id === routeUid ||
      assignment.id === "canvas-calendar:" + routeUid;
  });

  // Keep manual URLs in their own ID namespace so local UUIDs cannot collide
  // with a provider assignment ID. Other IDs retain provider-first behavior.
  const assignment = isManualRoute
    ? localAssignment ? localAssignmentToPlanning(localAssignment, input.courses.find((course) => course.id === localAssignment.courseId)) : providerAssignment
    : providerAssignment ?? (localAssignment ? localAssignmentToPlanning(localAssignment, input.courses.find((course) => course.id === localAssignment.courseId)) : undefined);
  if (!assignment) return { state: "not-found" };

  const catalog = buildSchoolCourseCatalog(input.courses, input.terms, input.providerCourses);
  const courseIdentity = resolveAssignmentCourse(assignment, catalog, input.courses);
  return { state: "found", assignment, isLocal: assignment.sourceType === "manual", ...(courseIdentity ? { courseIdentity } : {}) };
}
