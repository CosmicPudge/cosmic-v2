import type { SchoolEmailProposal } from "@/core/contracts/SchoolEmail";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import type { SchoolEvent } from "@/core/contracts/SchoolIntelligence";

export type SchoolEmailAssignmentDecision =
  | { status: "apply"; assignmentId: string; dueAt: Date }
  | { status: "needs_target"; reason: string };

function assignmentTitle(proposal: SchoolEmailProposal) {
  return proposal.title.replace(/\s+deadline update$/i, "").trim().toLocaleLowerCase();
}

function proposedDueAt(proposal: SchoolEmailProposal) {
  const value = /^Due (.+)\.$/i.exec(proposal.description)?.[1];
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Email proposals never use fuzzy matching; only one exact assignment may be selected. */
export function decideSchoolEmailAssignmentApplication(proposal: SchoolEmailProposal, assignments: SchoolPlanningAssignment[]): SchoolEmailAssignmentDecision {
  const dueAt = proposedDueAt(proposal);
  if (!dueAt) return { status: "needs_target", reason: "The proposed due date is not unambiguous." };
  const matches = assignments.filter((assignment) => assignment.title.trim().toLocaleLowerCase() === assignmentTitle(proposal));
  if (matches.length !== 1) return { status: "needs_target", reason: matches.length ? "More than one School assignment matches this update." : "The School assignment could not be identified safely." };
  return { status: "apply", assignmentId: matches[0].id, dueAt };
}

export function applySchoolEmailEventUpdate(event: SchoolEvent, proposal: SchoolEmailProposal): SchoolEvent | null {
  const provenance = [...event.provenance, { sourceId: proposal.sourceId, sourceVersion: 1, proposalId: proposal.id, excerpt: proposal.evidence, extractor: "deterministic" as const }];
  if (proposal.type === "event_canceled" || proposal.type === "class_canceled") return { ...event, status: "canceled", provenance };
  if (proposal.type === "uniform_changed") { const value = /^Uniform:\s+(.+)\.$/i.exec(proposal.description)?.[1]; return value ? { ...event, attire: { value, certainty: "explicit" }, provenance } : null; }
  if (proposal.type === "required_items_changed") { const value = /^Bring:\s+(.+)\.$/i.exec(proposal.description)?.[1]; return value ? { ...event, requiredItems: value.split(/\s+and\s+|,\s*/).map((item) => item.trim()).filter(Boolean), provenance } : null; }
  if (proposal.type === "event_location_changed") { const value = /^New location\s+(.+)\.$/i.exec(proposal.description)?.[1]; return value ? { ...event, location: { ...(event.location ?? {}), name: value }, provenance } : null; }
  if (proposal.type === "event_time_changed" || proposal.type === "class_rescheduled") {
    const value = /^New time\s+(\d{2}):(\d{2})\.$/i.exec(proposal.description); if (!value || !event.startsAt) return null;
    const date = new Date(event.startsAt); if (Number.isNaN(date.getTime())) return null; date.setUTCHours(Number(value[1]), Number(value[2]), 0, 0);
    const oldEnd = event.endsAt ? new Date(event.endsAt).getTime() : NaN; const oldStart = new Date(event.startsAt).getTime(); const duration = oldEnd > oldStart ? oldEnd - oldStart : 60 * 60 * 1000;
    return { ...event, startsAt: date.toISOString(), endsAt: new Date(date.getTime() + duration).toISOString(), provenance };
  }
  return null;
}
