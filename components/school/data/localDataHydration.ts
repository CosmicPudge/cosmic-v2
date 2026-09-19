import type { AcademicGoal, Assignment, Course, Grade, SchoolResource, SchoolTerm } from "@/core/contracts/School";
import { safeSchoolDate } from "@/services/school/hydration";

export interface LocalSchoolDataShape {
  version: 1;
  terms: SchoolTerm[];
  courses: Course[];
  assignments: Assignment[];
  grades: Grade[];
  goals: AcademicGoal[];
  resources: SchoolResource[];
}

export const emptyLocalSchoolData: LocalSchoolDataShape = { version: 1, terms: [], courses: [], assignments: [], grades: [], goals: [], resources: [] };

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function hasId(value: unknown): value is Record<string, unknown> & { id: string } { return isRecord(value) && typeof value.id === "string"; }
function isGrade(value: unknown): value is Grade { return isRecord(value) && typeof value.courseId === "string"; }
function reviveDateFields(value: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> {
  const normalized = { ...value };
  for (const key of keys) {
    const date = safeSchoolDate(value[key]);
    if (date) normalized[key] = date;
    else delete normalized[key];
  }
  return normalized;
}

/** Revive JSON date values at the local School storage/sync boundary. Invalid optional dates stay unknown. */
export function normalizeLocalSchoolData(value: unknown): LocalSchoolDataShape {
  if (!isRecord(value) || value.version !== 1) return emptyLocalSchoolData;
  const terms = Array.isArray(value.terms) ? value.terms.filter(hasId).map((item) => reviveDateFields(item, ["startDate", "endDate"]) as unknown as SchoolTerm) : [];
  const courses = Array.isArray(value.courses) ? value.courses.filter(hasId) as unknown as Course[] : [];
  const assignments = Array.isArray(value.assignments) ? value.assignments.filter(hasId).map((item) => reviveDateFields(item, ["dueAt"]) as unknown as Assignment) : [];
  const grades = Array.isArray(value.grades) ? value.grades.filter(isGrade) : [];
  const goals = Array.isArray(value.goals) ? value.goals.filter(hasId).map((item) => reviveDateFields(item, ["dueAt"]) as unknown as AcademicGoal) : [];
  const resources = Array.isArray(value.resources) ? value.resources.filter(hasId) as unknown as SchoolResource[] : [];
  return { version: 1, terms, courses, assignments, grades, goals, resources };
}
