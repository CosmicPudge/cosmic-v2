import type { Course, SchoolTerm } from "@/core/contracts/School";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";

export interface CanvasCourseDescriptor {
  raw: string;
  termName: string;
  courseCode: string;
  section?: string;
  providerSuffix?: string;
}

export interface ResolvedCanvasAssignment {
  rawTitle: string;
  displayTitle: string;
  descriptor: CanvasCourseDescriptor;
  course?: Course;
}

const descriptorPattern = /^(.*?)\s+\[((?:Fall|Spring|Summer|Winter)\s+\d{4})\s+([A-Za-z]{2,8})[-\s]?(\d{3,5})(?:[-\s](\d{1,4}))?(?:\s+([A-Za-z0-9]+))?\]\s*$/i;

export function normalizeCourseCode(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const match = /^([A-Za-z]{2,8})\s*[-\s]?\s*(\d{3,5})$/i.exec(value.trim());
  return match ? `${match[1].toUpperCase()} ${match[2]}` : undefined;
}

function termKey(value: string | undefined): string | undefined {
  return value?.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function activeCourse(course: Course, terms: SchoolTerm[]): boolean {
  const term = terms.find((item) => item.id === course.termId);
  return term?.active === true;
}

export function parseCanvasCourseDescriptor(title: string): CanvasCourseDescriptor | undefined {
  const match = descriptorPattern.exec(title.trim());
  if (!match) return undefined;
  return {
    raw: match[0].slice(match[1].length).trim(),
    termName: match[2].replace(/\s+/g, " ").trim(),
    courseCode: `${match[3].toUpperCase()} ${match[4]}`,
    ...(match[5] ? { section: match[5] } : {}),
    ...(match[6] ? { providerSuffix: match[6] } : {}),
  };
}

export function resolveCanvasAssignment(
  title: string,
  courses: Course[],
  terms: SchoolTerm[],
): ResolvedCanvasAssignment | undefined {
  const descriptor = parseCanvasCourseDescriptor(title);
  if (!descriptor) return undefined;

  const matchingCode = courses.filter((course) => normalizeCourseCode(course.code) === descriptor.courseCode);
  const matchingTerm = matchingCode.filter((course) => {
    const term = terms.find((item) => item.id === course.termId);
    return termKey(term?.name) === termKey(descriptor.termName);
  });

  let course: Course | undefined;
  if (matchingTerm.length === 1 && !descriptor.section) course = matchingTerm[0];
  if (descriptor.section) {
    const matchingSection = matchingTerm.filter((item) => item.section?.trim() === descriptor.section);
    if (matchingSection.length === 1) course = matchingSection[0];
    else if (!matchingTerm.some((item) => item.section) && matchingTerm.length === 1) course = matchingTerm[0];
  }

  if (!course) {
    const activeMatches = matchingCode.filter((item) => activeCourse(item, terms));
    if (activeMatches.length === 1) course = activeMatches[0];
  }

  return { rawTitle: title, displayTitle: title.slice(0, title.length - descriptor.raw.length).trim(), descriptor, ...(course ? { course } : {}) };
}

export function resolveSchoolPlanningAssignments(
  assignments: SchoolPlanningAssignment[],
  courses: Course[],
  terms: SchoolTerm[],
): SchoolPlanningAssignment[] {
  return assignments.map((assignment) => {
    if (assignment.sourceType !== "canvas-calendar" && assignment.sourceType !== "canvas-api") return assignment;
    const resolved = resolveCanvasAssignment(assignment.title, courses, terms);
    if (!resolved) return assignment;
    const course = resolved.course;
    return {
      ...assignment,
      title: resolved.displayTitle,
      rawTitle: assignment.rawTitle ?? resolved.rawTitle,
      ...(course ? { courseId: course.id, courseName: course.name } : {}),
    };
  });
}
