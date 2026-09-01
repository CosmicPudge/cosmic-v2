import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { getDatabase } from "@/services/database/client";
import { schoolFindings } from "@/services/database/schema";
import type { SchoolSourceIntelligence } from "@/core/contracts/SchoolIntelligence";
import { applyAuthoritativeCourse } from "./courseOverride";
import { conflictKey, policyConflict, requirementConflict, type ConflictCandidate } from "./conflicts";

export type SchoolFindingRow = typeof schoolFindings.$inferSelect;

export async function listSchoolFindingsForAccount(accountId: string) {
  return getDatabase().select().from(schoolFindings).where(eq(schoolFindings.userId, accountId)).orderBy(asc(schoolFindings.createdAt));
}

export async function listSchoolFindings(accountId: string, sourceId: string) {
  return getDatabase().select().from(schoolFindings).where(and(eq(schoolFindings.userId, accountId), eq(schoolFindings.sourceId, sourceId))).orderBy(asc(schoolFindings.createdAt));
}

export async function getSchoolFinding(accountId: string, id: string) {
  return (await getDatabase().select().from(schoolFindings).where(and(eq(schoolFindings.userId, accountId), eq(schoolFindings.id, id))).limit(1))[0] ?? null;
}

export async function upsertSchoolFindings(accountId: string, sourceId: string, intelligence: SchoolSourceIntelligence, courseId?: string | null) {
  const findings = [
    ...intelligence.facts.filter((item) => ["assignment", "deadline", "required-item", "attire", "uniform", "bring", "wear", "prepare", "read", "equipment", "material", "other"].includes(item.kind)).map((item) => ({ id: `${sourceId}:fact:${item.id}`, type: item.kind === "assignment" || item.kind === "deadline" ? "assignment" : ["other"].includes(item.kind) ? "fact" : "requirement", payload: item as unknown as Record<string, unknown>, evidence: item.provenance[0]?.excerpt ?? item.value, confidence: item.certainty === "explicit" ? 1 : .5, certainty: item.certainty })),
    ...intelligence.events.map((item) => ({ id: `${sourceId}:event:${item.id}`, type: "event", payload: item, evidence: item.provenance[0]?.excerpt ?? item.title, confidence: item.certainty === "explicit" ? 1 : .5, certainty: item.certainty })),
    ...intelligence.actionItems.map((item) => ({ id: `${sourceId}:action:${item.id}`, type: "action_item", payload: item, evidence: item.provenance[0]?.excerpt ?? item.title, confidence: 1, certainty: "explicit" })),
  ];
  return Promise.all(findings.map((finding) => getDatabase().insert(schoolFindings).values({ id: finding.id, userId: accountId, sourceId, type: finding.type, payload: courseId ? { ...finding.payload, courseId } : finding.payload, evidence: finding.evidence, confidence: finding.confidence, certainty: finding.certainty, reviewState: "pending" }).onConflictDoNothing({ target: schoolFindings.id }).returning())).then((rows) => rows.flatMap((row) => row));
}

export async function upsertRawSchoolFindings(accountId: string, sourceId: string, findings: Array<{ type: string; title: string; content: string; dueAt?: string; startsAt?: string; endsAt?: string; requirementCategory?: string; evidence: string; confidence: number; explicitness: string }>, courseId?: string | null) {
  return Promise.all(findings.map((finding) => { const id = `${sourceId}:image:${finding.type}:${finding.evidence.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 120)}`; const payload = courseId ? { ...finding, courseId } : finding; return getDatabase().insert(schoolFindings).values({ id, userId: accountId, sourceId, type: finding.type, payload, evidence: finding.evidence, confidence: finding.confidence, certainty: finding.explicitness === "explicit" ? "explicit" : "unknown", reviewState: "pending" }).onConflictDoUpdate({ target: schoolFindings.id, set: { payload, evidence: finding.evidence, confidence: finding.confidence, certainty: finding.explicitness === "explicit" ? "explicit" : "unknown", updatedAt: new Date() } }).returning(); })).then((rows) => rows.flatMap((row) => row));
}

export async function updateSchoolFinding(accountId: string, id: string, input: { reviewState: string; payload?: unknown }) {
  const [row] = await getDatabase().update(schoolFindings).set({ reviewState: input.reviewState, ...(input.payload === undefined ? {} : { payload: input.payload }), updatedAt: new Date(), ...(input.reviewState === "approved" || input.reviewState === "edited_then_approved" ? { appliedAt: new Date() } : {}) }).where(and(eq(schoolFindings.userId, accountId), eq(schoolFindings.id, id))).returning();
  return row ?? null;
}

export async function applySourceCourseToPendingFindings(accountId: string, sourceId: string, courseId: string | null) {
  const rows = await listSchoolFindings(accountId, sourceId);
  return Promise.all(rows.filter((row) => row.reviewState === "pending").map((row) => updateSchoolFinding(accountId, row.id, { reviewState: row.reviewState, payload: applyAuthoritativeCourse(row.payload, courseId) })));
}

export async function reconcileSchoolConflicts(accountId: string, sourceId: string) {
  const all = await getDatabase().select().from(schoolFindings).where(eq(schoolFindings.userId, accountId));
  const incoming = all.filter((row) => row.sourceId === sourceId && row.reviewState === "pending" && row.type !== "conflict") as unknown as ConflictCandidate[];
  const existing = all.filter((row) => row.sourceId !== sourceId && (row.reviewState === "approved" || row.reviewState === "edited_then_approved") && row.type !== "conflict") as unknown as ConflictCandidate[];
  const conflicts = incoming.flatMap((newFinding) => existing.filter((oldFinding) => requirementConflict(oldFinding, newFinding) || policyConflict(oldFinding, newFinding)).map((oldFinding) => ({ id: conflictKey(oldFinding.id, newFinding.id), userId: accountId, sourceId, type: "conflict", payload: { existingFindingId: oldFinding.id, incomingFindingId: newFinding.id, existingSourceId: oldFinding.sourceId, incomingSourceId: newFinding.sourceId, existingValue: oldFinding.payload.value ?? oldFinding.payload.content ?? oldFinding.evidence, incomingValue: newFinding.payload.value ?? newFinding.payload.content ?? newFinding.evidence, category: newFinding.payload.requirementCategory ?? newFinding.payload.kind ?? newFinding.type }, evidence: `Existing: ${oldFinding.evidence} | New: ${newFinding.evidence}`, confidence: 1, certainty: "explicit", reviewState: "pending" })));
  return Promise.all(conflicts.map((conflict) => getDatabase().insert(schoolFindings).values(conflict).onConflictDoNothing({ target: schoolFindings.id }).returning())).then((rows) => rows.flatMap((row) => row));
}
