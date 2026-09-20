import type { LocalSchoolNote, LocalSchoolDataShape } from "@/components/school/data/localDataHydration";
import type { CosmicScopeKind } from "@/services/storage/scope";

export type SchoolNotesStorageMode = "local" | "account";

export function getSchoolNotesStorageMode(scopeKind: CosmicScopeKind): SchoolNotesStorageMode {
  return scopeKind === "account" ? "account" : "local";
}

export function saveLocalSchoolNote(data: LocalSchoolDataShape, input: LocalSchoolNote, now = new Date()) {
  const title = input.title.trim();
  const content = input.content.trim();
  if (!title || !content) return { data, error: "Title and content are required." };
  if (title.length > 500 || content.length > 50_000) return { data, error: "Note exceeds the supported length." };
  if (input.courseId && data.courses.filter((course) => course.id === input.courseId).length !== 1) {
    return { data, error: "Choose a course from your local School courses." };
  }

  const previous = (data.notes ?? []).find((note) => note.id === input.id);
  const note: LocalSchoolNote = {
    id: input.id,
    title,
    content,
    ...(input.courseId ? { courseId: input.courseId } : {}),
    topics: [...new Set(input.topics.filter((topic) => topic.trim()).map((topic) => topic.trim().slice(0, 120)))].slice(0, 30),
    ...(input.classDate ? { classDate: input.classDate } : {}),
    createdAt: previous?.createdAt ?? input.createdAt ?? now,
    updatedAt: now,
  };
  return { data: { ...data, notes: [...(data.notes ?? []).filter((item) => item.id !== note.id), note] }, note };
}

export function deleteLocalSchoolNote(data: LocalSchoolDataShape, noteId: string) {
  return { ...data, notes: (data.notes ?? []).filter((note) => note.id !== noteId) };
}

export function filterLocalSchoolNotes(notes: LocalSchoolNote[], courseId?: string) {
  return courseId ? notes.filter((note) => note.courseId === courseId) : notes;
}
