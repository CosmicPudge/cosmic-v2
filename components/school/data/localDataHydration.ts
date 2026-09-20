import type { AcademicGoal, Assignment, Course, Grade, SchoolResource, SchoolTerm } from "@/core/contracts/School";
import { safeSchoolDate } from "@/services/school/hydration";

export interface LocalStudySet {
  id: string;
  title: string;
  description?: string;
  courseId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocalStudyCard {
  id: string;
  setId: string;
  front: string;
  back: string;
  notes?: string;
  reviewCount: number;
  intervalDays: number;
  lastReviewedAt: Date | null;
  nextReviewAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocalSchoolNote {
  id: string;
  title: string;
  content: string;
  courseId?: string;
  topics: string[];
  classDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocalSchoolDataShape {
  version: 1;
  terms: SchoolTerm[];
  courses: Course[];
  assignments: Assignment[];
  grades: Grade[];
  goals: AcademicGoal[];
  resources: SchoolResource[];
  studySets?: LocalStudySet[];
  flashcards?: LocalStudyCard[];
  notes?: LocalSchoolNote[];
}

export const emptyLocalSchoolData: LocalSchoolDataShape = { version: 1, terms: [], courses: [], assignments: [], grades: [], goals: [], resources: [], studySets: [], flashcards: [], notes: [] };

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

function nonNegativeInteger(value: unknown) { return Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : 0; }

function normalizeStudySets(value: unknown): LocalStudySet[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> & { id: string } => hasId(item) && typeof item.title === "string" && Boolean(item.title.trim()))
    .map((item) => {
      const createdAt = safeSchoolDate(item.createdAt) ?? new Date(0);
      const updatedAt = safeSchoolDate(item.updatedAt) ?? createdAt;
      return {
        id: item.id,
        title: (item.title as string).trim().slice(0, 300),
        ...(typeof item.description === "string" && item.description.trim() ? { description: item.description.trim().slice(0, 2_000) } : {}),
        ...(typeof item.courseId === "string" && item.courseId ? { courseId: item.courseId } : {}),
        createdAt,
        updatedAt,
      };
    });
}

function normalizeFlashcards(value: unknown, sets: LocalStudySet[]): LocalStudyCard[] {
  if (!Array.isArray(value)) return [];
  const setIds = new Set(sets.map((set) => set.id));
  return value.filter((item): item is Record<string, unknown> & { id: string } =>
    hasId(item) && typeof item.setId === "string" && setIds.has(item.setId)
      && typeof item.front === "string" && Boolean(item.front.trim())
      && typeof item.back === "string" && Boolean(item.back.trim()),
  ).map((item) => {
    const createdAt = safeSchoolDate(item.createdAt) ?? new Date(0);
    return {
      id: item.id,
      setId: item.setId as string,
      front: (item.front as string).trim().slice(0, 10_000),
      back: (item.back as string).trim().slice(0, 10_000),
      ...(typeof item.notes === "string" && item.notes.trim() ? { notes: item.notes.trim().slice(0, 5_000) } : {}),
      reviewCount: nonNegativeInteger(item.reviewCount),
      intervalDays: nonNegativeInteger(item.intervalDays),
      lastReviewedAt: item.lastReviewedAt === null ? null : safeSchoolDate(item.lastReviewedAt) ?? null,
      nextReviewAt: item.nextReviewAt === null ? null : safeSchoolDate(item.nextReviewAt) ?? null,
      createdAt,
      updatedAt: safeSchoolDate(item.updatedAt) ?? createdAt,
    };
  });
}

function normalizeLocalNotes(value: unknown, courses: Course[]): LocalSchoolNote[] {
  if (!Array.isArray(value)) return [];
  const courseCounts = new Map<string, number>();
  courses.forEach((course) => courseCounts.set(course.id, (courseCounts.get(course.id) ?? 0) + 1));
  const unique = new Map<string, LocalSchoolNote>();
  for (const item of value) {
    if (!hasId(item) || typeof item.title !== "string" || !item.title.trim() || typeof item.content !== "string" || !item.content.trim()) continue;
    const createdAt = safeSchoolDate(item.createdAt) ?? new Date(0);
    const requestedCourseId = typeof item.courseId === "string" && item.courseId ? item.courseId : undefined;
    const note: LocalSchoolNote = {
      id: item.id,
      title: item.title.trim().slice(0, 500),
      content: item.content.trim().slice(0, 50_000),
      ...(requestedCourseId && courseCounts.get(requestedCourseId) === 1 ? { courseId: requestedCourseId } : {}),
      topics: Array.isArray(item.topics) ? [...new Set(item.topics.filter((topic): topic is string => typeof topic === "string" && Boolean(topic.trim())).map((topic) => topic.trim().slice(0, 120)))].slice(0, 30) : [],
      ...(safeSchoolDate(item.classDate) ? { classDate: safeSchoolDate(item.classDate) } : {}),
      createdAt,
      updatedAt: safeSchoolDate(item.updatedAt) ?? createdAt,
    };
    if (note.title && note.content) unique.set(note.id, note);
  }
  return [...unique.values()];
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
  const studySets = normalizeStudySets(value.studySets);
  const flashcards = normalizeFlashcards(value.flashcards, studySets);
  const notes = normalizeLocalNotes(value.notes, courses);
  return { version: 1, terms, courses, assignments, grades, goals, resources, studySets, flashcards, notes };
}
