import type { Course } from "@/core/contracts/School";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import { assignmentBelongsToCourse } from "./courseExperience";
import type { SchoolCourseIdentity } from "./courseIdentity";
import { dedupeSchoolAssignments } from "./assignmentIdentity";
import { isAssignmentActiveForPlanning, isAssignmentOverdue } from "./planning";

export type AssignmentWorkloadStatus = "active" | "overdue" | "due-soon" | "completed" | "all";
export type AssignmentWorkloadSource = "all" | "cosmic" | "provider";
export type AssignmentWorkloadBucket = "needsAttention" | "dueSoon" | "later" | "undated";

export interface AssignmentWorkloadFilters {
  courseId?: string;
  status: AssignmentWorkloadStatus;
  source: AssignmentWorkloadSource;
  search: string;
}

export function resolveAssignmentCourse(assignment: SchoolPlanningAssignment, catalog: SchoolCourseIdentity[], courses: Course[]): SchoolCourseIdentity | undefined {
  if (assignment.courseId) {
    const exact = catalog.filter((identity) => identity.id === assignment.courseId || identity.localCourseId === assignment.courseId || identity.providerCourseIds.includes(assignment.courseId!));
    return exact.length === 1 ? exact[0] : undefined;
  }
  const matches = catalog.filter((identity) => assignmentBelongsToCourse(assignment, identity, identity.localCourseId ? courses.find((course) => course.id === identity.localCourseId) : undefined));
  return matches.length === 1 ? matches[0] : undefined;
}

export function classifyAssignmentWorkload(assignment: SchoolPlanningAssignment, now: Date): AssignmentWorkloadBucket | undefined {
  if (!isAssignmentActiveForPlanning(assignment)) return undefined;
  if (!hasValidDueDate(assignment)) return "undated";
  const dayBoundary = dayStart(now);
  if (isAssignmentOverdue(assignment, dayBoundary)) return "needsAttention";
  if (dueSoon(assignment, dayBoundary)) return "dueSoon";
  return "later";
}

export function assignmentWorkloadLabel(assignment: SchoolPlanningAssignment, now: Date): string {
  const bucket = classifyAssignmentWorkload(assignment, now);
  if (!bucket) return assignment.completionStatus.replaceAll("_", " ");
  return bucket === "needsAttention" ? "Overdue" : bucket === "dueSoon" ? "Due soon" : bucket === "undated" ? "No due date" : "Upcoming";
}

function dueSoon(assignment: SchoolPlanningAssignment, now: Date): boolean {
  if (!isAssignmentActiveForPlanning(assignment) || !hasValidDueDate(assignment) || isAssignmentOverdue(assignment, now)) return false;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start); end.setDate(end.getDate() + 4);
  return assignment.dueAt! < end;
}

function dayStart(date: Date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
function hasValidDueDate(assignment: SchoolPlanningAssignment) { return assignment.dueAt instanceof Date && Number.isFinite(assignment.dueAt.getTime()); }

function matchesStatus(bucket: AssignmentWorkloadBucket | undefined, status: AssignmentWorkloadStatus): boolean {
  if (status === "all") return true;
  if (status === "active") return bucket !== undefined;
  if (status === "completed") return bucket === undefined;
  if (status === "overdue") return bucket === "needsAttention";
  return bucket === "dueSoon";
}

export function buildAssignmentWorkload(input: {
  assignments: SchoolPlanningAssignment[];
  catalog: SchoolCourseIdentity[];
  courses: Course[];
  filters: AssignmentWorkloadFilters;
  now: Date;
}) {
  // Today classifies work by local calendar day; use that same boundary here
  // so an earlier clock time today does not become overdue in only one view.
  const deduped = dedupeSchoolAssignments(input.assignments);
  const bucketById = new Map(deduped.map((item) => [item.id, classifyAssignmentWorkload(item, input.now)]));
  const bucketOrder: Array<AssignmentWorkloadBucket | "completed"> = ["needsAttention", "dueSoon", "later", "undated", "completed"];
  const bucketFor = (item: SchoolPlanningAssignment): AssignmentWorkloadBucket | "completed" => bucketById.get(item.id) ?? "completed";
  deduped.sort((left, right) => {
    const bucketDifference = bucketOrder.indexOf(bucketFor(left)) - bucketOrder.indexOf(bucketFor(right));
    if (bucketDifference) return bucketDifference;
    const leftDue = hasValidDueDate(left) ? left.dueAt!.getTime() : Number.POSITIVE_INFINITY;
    const rightDue = hasValidDueDate(right) ? right.dueAt!.getTime() : Number.POSITIVE_INFINITY;
    return leftDue - rightDue || left.title.localeCompare(right.title) || left.id.localeCompare(right.id);
  });
  const resolvedCourseById = new Map<string, SchoolCourseIdentity>();
  for (const item of deduped) {
    const resolved = resolveAssignmentCourse(item, input.catalog, input.courses);
    if (resolved) resolvedCourseById.set(item.id, resolved);
  }
  const query = input.filters.search.trim().toLocaleLowerCase();
  const items = deduped.filter((item) => {
    const course = resolvedCourseById.get(item.id);
    if (input.filters.courseId && course?.id !== input.filters.courseId) return false;
    if (!matchesStatus(bucketById.get(item.id), input.filters.status)) return false;
    if (input.filters.source === "cosmic" && item.sourceType !== "manual") return false;
    if (input.filters.source === "provider" && item.sourceType === "manual") return false;
    if (query) {
      const courseText = course ? `${course.name} ${course.code ?? ""}` : `${item.courseName ?? "Unmatched course"}`;
      if (!`${item.title} ${courseText}`.toLocaleLowerCase().includes(query)) return false;
    }
    return true;
  });
  const groups: Record<AssignmentWorkloadBucket | "completed", SchoolPlanningAssignment[]> = { needsAttention: [], dueSoon: [], later: [], undated: [], completed: [] };
  for (const item of items) groups[bucketById.get(item.id) ?? "completed"].push(item);
  return {
    items,
    resolvedCourseById,
    groups,
    summary: {
      needsAttention: groups.needsAttention.length,
      dueSoon: groups.dueSoon.length,
      laterUndated: groups.later.length + groups.undated.length,
      active: groups.needsAttention.length + groups.dueSoon.length + groups.later.length + groups.undated.length,
    },
  };
}
