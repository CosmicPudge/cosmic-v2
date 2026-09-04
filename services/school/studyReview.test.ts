import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { calculateReview, isCardDue } from "./studyReview.ts";

test("study review scheduling uses short retry and deterministic intervals", () => {
    const now = new Date("2026-09-03T12:00:00.000Z");
    assert.deepEqual(calculateReview({ reviewCount: 0, intervalDays: 0 }, "again", now).nextReviewAt, new Date("2026-09-03T12:10:00.000Z"));
    assert.equal(calculateReview({ reviewCount: 1, intervalDays: 2 }, "hard", now).intervalDays, 3);
    assert.equal(calculateReview({ reviewCount: 1, intervalDays: 2 }, "good", now).intervalDays, 4);
    assert.equal(calculateReview({ reviewCount: 1, intervalDays: 2 }, "easy", now).intervalDays, 6);
});

test("study review treats new cards and elapsed cards as due", () => {
    const now = new Date("2026-09-03T12:00:00.000Z");
    assert.equal(isCardDue({ lastReviewedAt: null, nextReviewAt: null }, now), true);
    assert.equal(isCardDue({ lastReviewedAt: now, nextReviewAt: new Date("2026-09-02T12:00:00.000Z") }, now), true);
    assert.equal(isCardDue({ lastReviewedAt: now, nextReviewAt: new Date("2026-09-04T12:00:00.000Z") }, now), false);
});
