import type { Course, SchoolTerm } from "@/core/contracts/School";
import type { SchoolCanvasCourse } from "./domain";

export type SchoolCourseReferenceSource = "manual" | "canvas-api" | "canvas-calendar" | "school-source";
export type SchoolCourseMatchStatus = "matched" | "unmatched" | "ambiguous";

export interface SchoolCourseReference {
  source: SchoolCourseReferenceSource;
  providerCourseId?: string;
  courseId?: string;
  courseCode?: string;
  courseName?: string;
  termName?: string;
  section?: string;
}

export interface SchoolCourseMatch {
  status: SchoolCourseMatchStatus;
  course?: Course;
  candidates: Course[];
  reason: "explicit_local_id" | "provider_id" | "code_term_section" | "code_term" | "code" | "name" | "none";
}

export interface SchoolCourseIdentity {
  id: string;
  name: string;
  code?: string;
  section?: string;
  localCourseId?: string;
  providerCourseIds: string[];
  sources: SchoolCourseReferenceSource[];
  matchStatus: SchoolCourseMatchStatus;
  canvasCourse?: SchoolCanvasCourse;
}

export function normalizeCourseName(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.toLocaleLowerCase().replace(/[^a-z0-9]+/gi, " ").trim().replace(/\s+/g, " ");
  return normalized || undefined;
}

export function normalizeCourseIdentityCode(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const match = /^([a-z]{2,8})\s*[-\s]?\s*(\d{3,5})$/i.exec(value.trim());
  return match ? `${match[1].toUpperCase()} ${match[2]}` : undefined;
}

export function matchSchoolCourse(reference: SchoolCourseReference, courses: Course[], terms: SchoolTerm[], providerCourses: SchoolCanvasCourse[] = []): SchoolCourseMatch {
  if (reference.courseId) {
    const course = courses.find((item) => item.id === reference.courseId);
    if (course) return { status: "matched", course, candidates: [course], reason: "explicit_local_id" };
  }

  if (reference.providerCourseId) {
    const provider = providerCourses.find((item) => item.id === reference.providerCourseId);
    if (provider) return matchSchoolCourse({ ...reference, courseCode: reference.courseCode ?? provider.courseCode, courseName: reference.courseName ?? provider.name, providerCourseId: undefined }, courses, terms);
  }

  const code = normalizeCourseIdentityCode(reference.courseCode);
  const name = normalizeCourseName(reference.courseName);
  const termName = reference.termName?.trim().replace(/\s+/g, " ").toLocaleLowerCase();
  const section = reference.section?.trim();
  let candidates = courses.filter((course) => {
    if (code && normalizeCourseIdentityCode(course.code) !== code) return false;
    if (!code && name && normalizeCourseName(course.name) !== name) return false;
    if (termName && terms.find((item) => item.id === course.termId)?.name.trim().replace(/\s+/g, " ").toLocaleLowerCase() !== termName) return false;
    return Boolean(code || name);
  });

  if (section) candidates = candidates.filter((course) => course.section?.trim() === section);
  if (!candidates.length && section) candidates = courses.filter((course) => {
    const sameIdentity = code ? normalizeCourseIdentityCode(course.code) === code : normalizeCourseName(course.name) === name;
    const sameTerm = !termName || terms.find((item) => item.id === course.termId)?.name.trim().replace(/\s+/g, " ").toLocaleLowerCase() === termName;
    return sameIdentity && sameTerm && !course.section;
  });

  if (candidates.length === 1) {
    const reason = code && termName && section ? "code_term_section" : code && termName ? "code_term" : code ? "code" : "name";
    return { status: "matched", course: candidates[0], candidates, reason };
  }
  return { status: candidates.length ? "ambiguous" : "unmatched", candidates, reason: "none" };
}

export function buildSchoolCourseCatalog(courses: Course[], terms: SchoolTerm[], canvasCourses: SchoolCanvasCourse[] = []): SchoolCourseIdentity[] {
  const catalog: SchoolCourseIdentity[] = courses.map((course) => ({ id: course.id, name: course.name, ...(course.code ? { code: normalizeCourseIdentityCode(course.code) ?? course.code } : {}), ...(course.section ? { section: course.section } : {}), localCourseId: course.id, providerCourseIds: [], sources: ["manual"], matchStatus: "matched" }));
  for (const canvasCourse of canvasCourses) {
    const match = matchSchoolCourse({ source: "canvas-api", providerCourseId: canvasCourse.id, courseCode: canvasCourse.courseCode, courseName: canvasCourse.name }, courses, terms, canvasCourses);
    const local = match.course && catalog.find((item) => item.localCourseId === match.course?.id);
    if (local) { local.providerCourseIds.push(canvasCourse.id); local.sources.push("canvas-api"); local.canvasCourse = canvasCourse; continue; }
    catalog.push({ id: `canvas:${canvasCourse.id}`, name: canvasCourse.name, ...(canvasCourse.courseCode ? { code: normalizeCourseIdentityCode(canvasCourse.courseCode) ?? canvasCourse.courseCode } : {}), providerCourseIds: [canvasCourse.id], sources: ["canvas-api"], matchStatus: match.status, canvasCourse });
  }
  return catalog;
}
