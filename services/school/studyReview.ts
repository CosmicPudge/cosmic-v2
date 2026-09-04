export type ReviewRating = "again" | "hard" | "good" | "easy";
export interface ReviewState { reviewCount: number; intervalDays: number; lastReviewedAt?: Date | null; nextReviewAt?: Date | null; }

/** Deterministic manual review intervals. Again resets the day interval to 0. */
export function calculateReview(state: ReviewState, rating: ReviewRating, now = new Date()): ReviewState {
  const intervalDays = rating === "again" ? 0 : rating === "hard" ? state.intervalDays ? Math.max(1, Math.ceil(state.intervalDays * 1.2)) : 1 : rating === "good" ? state.intervalDays ? Math.max(1, state.intervalDays * 2) : 1 : state.intervalDays ? Math.max(2, state.intervalDays * 3) : 2;
  const nextReviewAt = rating === "again" ? new Date(now.getTime() + 10 * 60_000) : new Date(now.getTime() + intervalDays * 86_400_000);
  return { reviewCount: state.reviewCount + 1, intervalDays, lastReviewedAt: now, nextReviewAt };
}

export function isCardDue(state: Pick<ReviewState, "lastReviewedAt" | "nextReviewAt">, now = new Date()) { return !state.lastReviewedAt || Boolean(state.nextReviewAt && state.nextReviewAt <= now); }
