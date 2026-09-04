import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the extension explicitly.
import { aggregateTranscriptExtractions } from "./transcriptAggregation.ts";
import type { TranscriptChunkExtraction } from "./transcriptChunkParser.ts";

const empty = (): TranscriptChunkExtraction => ({ concepts: [], assignments: [], projects: [], assessments: [], schedule: [], policies: [], grading: [], materialsResources: [], examples: [], uncertainties: [], topics: [] });
test("aggregation removes exact overlap duplicates without collapsing numeric differences", () => {
  const first = empty(); first.policies = [{ statement: "No late homework is accepted." }]; first.grading = [{ statement: "Attendance: 5%" }];
  const second = empty(); second.policies = [{ statement: "No late homework is accepted." }]; second.grading = [{ statement: "Project report: 15%" }];
  const result = aggregateTranscriptExtractions([first, second]);
  assert.equal(result.policies.length, 1);
  assert.equal(result.grading.length, 2);
});

test("aggregation preserves conflicting schedule evidence", () => {
  const first = empty(); first.schedule = [{ statement: "Seminar may be Friday at 3:30.", uncertain: true }];
  const second = empty(); second.schedule = [{ statement: "Seminar is 10:30 Friday." }];
  assert.equal(aggregateTranscriptExtractions([first, second]).schedule.length, 2);
});
