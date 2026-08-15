"use client";

import { useCallback, useEffect, useState } from "react";
import type { AcademicGoal, Assignment, Course, Grade, SchoolResource, SchoolTerm } from "@/core/contracts/School";

export const SCHOOL_STORAGE_KEY = "cosmic.school.local-data";
export const SCHOOL_UPDATE_EVENT = "cosmic:school-local-data-updated";
const VERSION = 1;

export interface LocalSchoolData {
  version: 1;
  terms: SchoolTerm[];
  courses: Course[];
  assignments: Assignment[];
  grades: Grade[];
  goals: AcademicGoal[];
  resources: SchoolResource[];
}

export const emptySchoolData: LocalSchoolData = { version: VERSION, terms: [], courses: [], assignments: [], grades: [], goals: [], resources: [] };

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function readArray<T>(value: unknown, guard: (item: unknown) => item is T): T[] { return Array.isArray(value) ? value.filter(guard) : []; }
function hasId(value: unknown): value is { id: string } { return isRecord(value) && typeof value.id === "string"; }
function isGrade(value: unknown): value is Grade { return isRecord(value) && typeof value.courseId === "string"; }
function isLocalSchoolData(value: unknown): value is LocalSchoolData {
  return isRecord(value)
    && value.version === VERSION
    && Array.isArray(value.terms) && value.terms.every(hasId)
    && Array.isArray(value.courses) && value.courses.every(hasId)
    && Array.isArray(value.assignments) && value.assignments.every(hasId)
    && Array.isArray(value.grades) && value.grades.every(isGrade)
    && Array.isArray(value.goals) && value.goals.every(hasId)
    && Array.isArray(value.resources) && value.resources.every(hasId);
}

export function readSchoolSnapshot(): LocalSchoolData {
  try {
    const raw = window.localStorage.getItem(SCHOOL_STORAGE_KEY);
    if (!raw) return emptySchoolData;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== VERSION) return emptySchoolData;
    return {
      version: VERSION,
      terms: readArray(parsed.terms, hasId) as SchoolTerm[],
      courses: readArray(parsed.courses, hasId) as Course[],
      assignments: readArray(parsed.assignments, hasId) as Assignment[],
      grades: readArray(parsed.grades, isGrade),
      goals: readArray(parsed.goals, hasId) as AcademicGoal[],
      resources: readArray(parsed.resources, hasId) as SchoolResource[],
    };
  } catch { return emptySchoolData; }
}

export function replaceSchoolSnapshot(data: LocalSchoolData) {
  if (!isLocalSchoolData(data)) throw new Error("Invalid School data.");
  window.localStorage.setItem(SCHOOL_STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent(SCHOOL_UPDATE_EVENT, { detail: data }));
}

export function useLocalSchoolRepository() {
  const [data, setData] = useState<LocalSchoolData>(emptySchoolData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setData(readSchoolSnapshot());
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);
  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(SCHOOL_STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(SCHOOL_UPDATE_EVENT, { detail: data }));
  }, [data, ready]);
  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key === SCHOOL_STORAGE_KEY) setData(readSchoolSnapshot());
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    function syncLocal(event: Event) {
      if (!(event instanceof CustomEvent)) return;
      const next: unknown = event.detail;
      if (isLocalSchoolData(next)) setData(next);
    }
    window.addEventListener(SCHOOL_UPDATE_EVENT, syncLocal);
    return () => window.removeEventListener(SCHOOL_UPDATE_EVENT, syncLocal);
  }, []);

  const update = useCallback((recipe: (current: LocalSchoolData) => LocalSchoolData) => setData((current) => recipe(current)), []);
  const removeCourse = useCallback((id: string) => update((current) => ({ ...current, courses: current.courses.filter((course) => course.id !== id), assignments: current.assignments.filter((assignment) => assignment.courseId !== id), grades: current.grades.filter((grade) => grade.courseId !== id), resources: current.resources.filter((resource) => resource.courseId !== id) })), [update]);

  return {
    data, ready,
    addTerm: (term: SchoolTerm) => update((current) => ({ ...current, terms: [...current.terms.map((item) => ({ ...item, active: term.active ? false : item.active })), term] })),
    saveTerm: (term: SchoolTerm) => update((current) => ({ ...current, terms: [...current.terms.filter((item) => item.id !== term.id).map((item) => ({ ...item, active: term.active ? false : item.active })), term] })),
    removeTerm: (id: string) => update((current) => {
      const removedCourseIds = new Set(current.courses.filter((course) => course.termId === id).map((course) => course.id));
      return { ...current, terms: current.terms.filter((item) => item.id !== id), courses: current.courses.filter((course) => course.termId !== id), assignments: current.assignments.filter((assignment) => !assignment.courseId || !removedCourseIds.has(assignment.courseId)), grades: current.grades.filter((grade) => !removedCourseIds.has(grade.courseId)), resources: current.resources.filter((resource) => !resource.courseId || !removedCourseIds.has(resource.courseId)) };
    }),
    setActiveTerm: (id: string) => update((current) => ({ ...current, terms: current.terms.map((item) => ({ ...item, active: item.id === id })) })),
    saveCourse: (course: Course) => update((current) => ({ ...current, courses: current.courses.some((item) => item.id === course.id) ? current.courses.map((item) => item.id === course.id ? course : item) : [...current.courses, course] })),
    removeCourse,
    saveAssignment: (assignment: Assignment) => update((current) => ({ ...current, assignments: current.assignments.some((item) => item.id === assignment.id) ? current.assignments.map((item) => item.id === assignment.id ? assignment : item) : [...current.assignments, assignment] })),
    removeAssignment: (id: string) => update((current) => ({ ...current, assignments: current.assignments.filter((item) => item.id !== id) })),
    saveGrade: (grade: Grade) => update((current) => ({ ...current, grades: [...current.grades.filter((item) => item.id !== grade.id), grade] })),
    removeGrade: (id: string) => update((current) => ({ ...current, grades: current.grades.filter((item) => item.id !== id) })),
    saveGoal: (goal: AcademicGoal) => update((current) => ({ ...current, goals: current.goals.some((item) => item.id === goal.id) ? current.goals.map((item) => item.id === goal.id ? goal : item) : [...current.goals, goal] })),
    removeGoal: (id: string) => update((current) => ({ ...current, goals: current.goals.filter((item) => item.id !== id) })),
    saveResource: (resource: SchoolResource) => update((current) => ({ ...current, resources: current.resources.some((item) => item.id === resource.id) ? current.resources.map((item) => item.id === resource.id ? resource : item) : [...current.resources, resource] })),
    removeResource: (id: string) => update((current) => ({ ...current, resources: current.resources.filter((item) => item.id !== id) })),
    reset: () => setData(emptySchoolData),
  };
}
