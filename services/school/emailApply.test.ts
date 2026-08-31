import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { applySchoolEmailEventUpdate, decideSchoolEmailAssignmentApplication } from "./emailApplyLogic.ts";

const assignment = { id: "assignment-1", accountId: "account-1", title: "Math homework", sourceType: "manual" as const, completionStatus: "unknown" as const, planningStatus: "in_progress" as const, priority: "high" as const, estimatedMinutes: 45, personalNotes: "Keep existing planning fields", createdAt: new Date("2026-08-01"), updatedAt: new Date("2026-08-01") };
const proposal = { id: "proposal-1", accountId: "account-1", sourceId: "email:source", type: "assignment_due_date_changed" as const, title: "Math homework deadline update", description: "Due September 4, 2026, 11:59 PM.", evidence: "Math homework is due September 4, 2026, 11:59 PM", confidence: 0.95, status: "pending" as const, createdAt: new Date("2026-08-30"), updatedAt: new Date("2026-08-30") };

test("applies a uniquely identified assignment due-date change", () => {
  const result = decideSchoolEmailAssignmentApplication(proposal, [assignment]);
  assert.equal(result.status, "apply");
  if (result.status === "apply") assert.equal(result.assignmentId, "assignment-1");
});
test("target decision does not alter planning fields", () => {
  const result = decideSchoolEmailAssignmentApplication(proposal, [assignment]);
  assert.equal(assignment.planningStatus, "in_progress");
  assert.equal(assignment.priority, "high");
  assert.equal(assignment.estimatedMinutes, 45);
  assert.equal(result.status, "apply");
});
test("duplicate or missing assignment targets require review", () => {
  assert.equal(decideSchoolEmailAssignmentApplication(proposal, [assignment, { ...assignment, id: "assignment-2" }]).status, "needs_target");
  assert.equal(decideSchoolEmailAssignmentApplication(proposal, []).status, "needs_target");
});
test("malformed due date requires review", () => {
  assert.equal(decideSchoolEmailAssignmentApplication({ ...proposal, description: "Due soon." }, [assignment]).status, "needs_target");
});
const event = { id: "event-1", accountId: "account-1", title: "LLAB", startsAt: "2026-09-03T06:30:00.000Z", endsAt: "2026-09-03T07:30:00.000Z", location: { name: "HPER" }, factIds: [], provenance: [{ sourceId: "source-1", sourceVersion: 1 }], certainty: "explicit" as const };
test("updates event time and location without changing its identity", () => {
  const moved = applySchoolEmailEventUpdate(event, { ...proposal, type: "event_time_changed", title: "LLAB time change", description: "New time 07:00.", evidence: "LLAB moved to 0700 in HPER Fieldhouse." });
  assert.equal(moved?.id, "event-1"); assert.equal(moved?.startsAt, "2026-09-03T07:00:00.000Z");
  const located = applySchoolEmailEventUpdate(event, { ...proposal, type: "event_location_changed", title: "LLAB location change", description: "New location HPER Fieldhouse.", evidence: "LLAB moved to HPER Fieldhouse." });
  assert.equal(located?.location?.name, "HPER Fieldhouse");
});
test("uniform, required-items, and cancellation updates are explicit", () => {
  assert.equal(applySchoolEmailEventUpdate(event, { ...proposal, type: "uniform_changed", description: "Uniform: OCPs.", evidence: "LLAB: Wear OCPs." })?.attire?.value, "OCPs");
  assert.deepEqual(applySchoolEmailEventUpdate(event, { ...proposal, type: "required_items_changed", description: "Bring: a water bottle and notebook.", evidence: "LLAB: Bring a water bottle and notebook." })?.requiredItems, ["a water bottle", "notebook"]);
  assert.equal(applySchoolEmailEventUpdate(event, { ...proposal, type: "event_canceled", description: "An event was explicitly canceled.", evidence: "LLAB canceled." })?.status, "canceled");
});
