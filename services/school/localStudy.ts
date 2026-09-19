import type { Course, SchoolResource } from "@/core/contracts/School";
import type { LocalSchoolDataShape, LocalStudyCard, LocalStudySet } from "@/components/school/data/localDataHydration";
import { calculateReview, isCardDue, type ReviewRating } from "./studyReview";

export type StudyCardInput = Pick<LocalStudyCard, "id" | "setId" | "front" | "back"> & Partial<Pick<LocalStudyCard, "notes">>;

export function saveLocalStudySet(data: LocalSchoolDataShape, input: Pick<LocalStudySet, "id" | "title"> & Partial<Pick<LocalStudySet, "description" | "courseId">>, now = new Date()) {
  const title = input.title.trim();
  if (!title) return { data, error: "Study set title is required." };
  if (input.courseId && !data.courses.some((course) => course.id === input.courseId)) return { data, error: "Choose a course from your local School courses." };
  const sets = data.studySets ?? [];
  const previous = sets.find((set) => set.id === input.id);
  const set: LocalStudySet = {
    id: input.id,
    title: title.slice(0, 300),
    ...(input.description?.trim() ? { description: input.description.trim().slice(0, 2_000) } : {}),
    ...(input.courseId ? { courseId: input.courseId } : {}),
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  };
  return { data: { ...data, studySets: [...sets.filter((item) => item.id !== set.id), set] }, set };
}

export function deleteLocalStudySet(data: LocalSchoolDataShape, setId: string) {
  return {
    ...data,
    studySets: (data.studySets ?? []).filter((set) => set.id !== setId),
    flashcards: (data.flashcards ?? []).filter((card) => card.setId !== setId),
  };
}

export function saveLocalStudyCards(data: LocalSchoolDataShape, inputs: StudyCardInput[], now = new Date()) {
  if (!inputs.length) return { data, error: "Add at least one valid card." };
  const sets = new Set((data.studySets ?? []).map((set) => set.id));
  if (inputs.some((card) => !sets.has(card.setId))) return { data, error: "Study set not found." };
  if (inputs.some((card) => !card.front.trim())) return { data, error: "Every card needs a front." };
  if (inputs.some((card) => !card.back.trim())) return { data, error: "Every card needs a back." };
  if (new Set(inputs.map((card) => card.id)).size !== inputs.length) return { data, error: "Card IDs must be unique." };
  const existing = new Map((data.flashcards ?? []).map((card) => [card.id, card]));
  for (const input of inputs) {
    const previous = existing.get(input.id);
    existing.set(input.id, {
      id: input.id,
      setId: input.setId,
      front: input.front.trim().slice(0, 10_000),
      back: input.back.trim().slice(0, 10_000),
      ...(input.notes?.trim() ? { notes: input.notes.trim().slice(0, 5_000) } : {}),
      reviewCount: previous?.reviewCount ?? 0,
      intervalDays: previous?.intervalDays ?? 0,
      lastReviewedAt: previous?.lastReviewedAt ?? null,
      nextReviewAt: previous?.nextReviewAt ?? null,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    });
  }
  return { data: { ...data, flashcards: [...existing.values()] } };
}

export function deleteLocalStudyCard(data: LocalSchoolDataShape, cardId: string) {
  return { ...data, flashcards: (data.flashcards ?? []).filter((card) => card.id !== cardId) };
}

export function reviewLocalStudyCard(data: LocalSchoolDataShape, cardId: string, rating: ReviewRating, now = new Date()) {
  const cards = data.flashcards ?? [];
  const card = cards.find((item) => item.id === cardId);
  if (!card) return { data, error: "Study card not found." };
  const review = calculateReview(card, rating, now);
  const updated: LocalStudyCard = { ...card, ...review, updatedAt: now };
  return { data: { ...data, flashcards: cards.map((item) => item.id === cardId ? updated : item) }, card: updated };
}

export function getLocalStudyQueue(cards: LocalStudyCard[], now = new Date()) {
  const reviewedDue = cards.filter((card) => card.lastReviewedAt && isCardDue(card, now));
  const newCards = cards.filter((card) => !card.lastReviewedAt);
  return [...reviewedDue, ...newCards];
}

export function getLocalStudySetStats(setId: string, cards: LocalStudyCard[], now = new Date()) {
  const setCards = cards.filter((card) => card.setId === setId);
  return {
    total: setCards.length,
    new: setCards.filter((card) => !card.lastReviewedAt).length,
    due: setCards.filter((card) => card.lastReviewedAt && isCardDue(card, now)).length,
  };
}

export function getLocalStudySetsForCourse(sets: LocalStudySet[], courseId: string) {
  return sets.filter((set) => set.courseId === courseId);
}

export function resolveLocalCourseFilter(requestedCourseId: string | null | undefined, courses: Course[]) {
  if (!requestedCourseId) return { course: undefined, invalid: false };
  const matches = courses.filter((course) => course.id === requestedCourseId);
  return { course: matches.length === 1 ? matches[0] : undefined, invalid: matches.length !== 1 };
}

export function filterLocalResources(resources: SchoolResource[], courseId?: string) {
  return courseId ? resources.filter((resource) => resource.courseId === courseId) : resources;
}

export function saveLocalResource(data: LocalSchoolDataShape, resource: SchoolResource) {
  return { ...data, resources: [...data.resources.filter((item) => item.id !== resource.id), resource] };
}

export function deleteLocalResource(data: LocalSchoolDataShape, resourceId: string) {
  return { ...data, resources: data.resources.filter((item) => item.id !== resourceId) };
}

export function studyCourseHref(courseId: string) {
  return `/school/study?course=${encodeURIComponent(courseId)}`;
}
