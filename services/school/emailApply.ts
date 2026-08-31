import "server-only";
import { decideSchoolEmailAssignmentApplication } from "./emailApplyLogic";
import { getSchoolSnapshotForAccount } from "./server";
import { getSchoolAssignment, updateSchoolAssignment } from "./assignmentRepository";
import { getSchoolEmailProposal, markSchoolEmailProposal } from "./emailRepository";
import { listSchoolSources, updateSchoolSourceRecord } from "./sources/repository";
import type { SchoolEvent, SchoolSourceIntelligence } from "@/core/contracts/SchoolIntelligence";
import { applySchoolEmailEventUpdate } from "./emailApplyLogic";

function eventTitleInEvidence(event: SchoolEvent, evidence: string) {
  return evidence.toLocaleLowerCase().includes(event.title.trim().toLocaleLowerCase());
}

async function applyEventProposal(accountId: string, proposal: NonNullable<Awaited<ReturnType<typeof getSchoolEmailProposal>>>) {
  const sources = await listSchoolSources(accountId);
  const candidates = sources.flatMap((source) => { const intelligence = source.intelligence as Partial<SchoolSourceIntelligence> | null; return (intelligence?.events ?? []).filter((event) => eventTitleInEvidence(event, proposal.evidence)).map((event) => ({ source, intelligence, event })); });
  if (candidates.length !== 1) return markSchoolEmailProposal(accountId, proposal.id, "needs_target", candidates.length ? "More than one School event matches this update." : "The School event could not be identified safely.");
  const candidate = candidates[0]; const event = applySchoolEmailEventUpdate(candidate.event, proposal);
  if (!event) return markSchoolEmailProposal(accountId, proposal.id, "needs_target", "The email update does not contain a supported explicit value.");
  const intelligence = { facts: candidate.intelligence?.facts ?? [], events: (candidate.intelligence?.events ?? []).map((item) => item.id === event.id ? event : item), actionItems: candidate.intelligence?.actionItems ?? [], conflicts: candidate.intelligence?.conflicts ?? [], warnings: candidate.intelligence?.warnings ?? [] };
  const updated = await updateSchoolSourceRecord(accountId, candidate.source.id, { intelligence });
  return updated ? markSchoolEmailProposal(accountId, proposal.id, "applied") : markSchoolEmailProposal(accountId, proposal.id, "failed", "The School event could not be updated; retry is available.");
}

export async function applySchoolEmailProposal(accountId: string, proposalId: string) {
  const proposal = await getSchoolEmailProposal(accountId, proposalId);
  if (!proposal) return null;
  if (proposal.status !== "pending") return proposal;

  if (["event_time_changed", "class_rescheduled", "event_location_changed", "event_canceled", "class_canceled", "uniform_changed", "required_items_changed"].includes(proposal.type)) return applyEventProposal(accountId, proposal);
  if (proposal.type !== "assignment_due_date_changed") return markSchoolEmailProposal(accountId, proposal.id, "needs_target", "This update needs a supported exact School target before it can be applied.");

  try {
    const snapshot = await getSchoolSnapshotForAccount(accountId);
    const decision = decideSchoolEmailAssignmentApplication(proposal, snapshot.planningAssignments ?? []);
    if (decision.status === "needs_target") return markSchoolEmailProposal(accountId, proposal.id, "needs_target", decision.reason);
    const assignment = await getSchoolAssignment(accountId, decision.assignmentId);
    if (!assignment) return markSchoolEmailProposal(accountId, proposal.id, "needs_target", "The selected School assignment is no longer available.");
    const updated = await updateSchoolAssignment(accountId, assignment.id, {
      dueAt: decision.dueAt,
      provenance: [...(assignment.provenance ?? []), { sourceType: "school-source", sourceId: proposal.sourceId, evidence: proposal.evidence, extractor: "deterministic" }],
    });
    if (!updated) return markSchoolEmailProposal(accountId, proposal.id, "failed", "The School assignment could not be updated.");
    return markSchoolEmailProposal(accountId, proposal.id, "applied");
  } catch {
    return markSchoolEmailProposal(accountId, proposal.id, "failed", "School update could not be applied; retry is available.");
  }
}
