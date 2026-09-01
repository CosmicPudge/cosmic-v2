export const COURSE_SCOPED_FINDING_TYPES = new Set(["note", "topic", "assignment", "requirement", "event"]);

export function isValidSchoolCourseId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 200 && !/\s/.test(value);
}

export function applyAuthoritativeCourse(payload: unknown, courseId: string | null) {
  const current = payload && typeof payload === "object" && !Array.isArray(payload) ? payload as Record<string, unknown> : {};
  return courseId ? { ...current, courseId } : current;
}
