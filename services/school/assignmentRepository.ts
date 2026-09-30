import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { getDatabase } from "@/services/database/client";
import { schoolAssignments } from "@/services/database/schema";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";
import { prepareSchoolOwnerWrite } from "./ownershipTransition";
import { canvasAssignmentIdentity, dedupeCanvasAssignmentRows } from "./providers/canvas/identity";

export type SchoolAssignmentRow = typeof schoolAssignments.$inferSelect;

function toAssignment(row: SchoolAssignmentRow): SchoolPlanningAssignment {
  const provenance = row.provenance as SchoolPlanningAssignment["provenance"];
  const providerMetadata = provenance?.find((item) => item.providerMetadata)?.providerMetadata;
  return {
    id: row.id, accountId: row.userId, title: row.title,
    ...(row.description ? { description: row.description } : {}), ...(row.courseId ? { courseId: row.courseId } : {}), ...(row.courseName ? { courseName: row.courseName } : {}),
    sourceType: row.sourceType as SchoolPlanningAssignment["sourceType"], ...(row.sourceId ? { sourceId: row.sourceId } : {}), ...(row.externalId ? { externalId: row.externalId } : {}),
    ...(row.dueAt ? { dueAt: row.dueAt } : {}), ...(row.availableAt ? { availableAt: row.availableAt } : {}), ...(row.lockAt ? { lockAt: row.lockAt } : {}),
    completionStatus: row.completionStatus as SchoolPlanningAssignment["completionStatus"], planningStatus: row.planningStatus as SchoolPlanningAssignment["planningStatus"], priority: row.priority as SchoolPlanningAssignment["priority"],
    ...(row.estimatedMinutes !== null ? { estimatedMinutes: row.estimatedMinutes } : {}), ...(row.pointsPossible !== null ? { pointsPossible: row.pointsPossible } : {}), ...(row.published !== null ? { published: row.published } : {}), ...(row.canvasUrl ? { canvasUrl: row.canvasUrl } : {}), ...(row.personalNotes ? { personalNotes: row.personalNotes } : {}), ...(row.provenance ? { provenance } : {}), ...(providerMetadata ? { providerMetadata } : {}),
    createdAt: row.createdAt, updatedAt: row.updatedAt, ...(row.lastSyncedAt ? { lastSyncedAt: row.lastSyncedAt } : {}), ...(row.sourceUpdatedAt ? { sourceUpdatedAt: row.sourceUpdatedAt } : {}),
  };
}

export async function listSchoolAssignments(accountId: string) {
  const rows = await getDatabase().select().from(schoolAssignments).where(eq(schoolAssignments.userId, accountId)).orderBy(asc(schoolAssignments.dueAt), asc(schoolAssignments.title));
  return rows.map(toAssignment);
}

export async function getSchoolAssignment(accountId: string, id: string) {
  const [row] = await getDatabase().select().from(schoolAssignments).where(and(eq(schoolAssignments.userId, accountId), eq(schoolAssignments.id, id))).limit(1);
  return row ? toAssignment(row) : null;
}

export async function createSchoolAssignment(input: typeof schoolAssignments.$inferInsert) {
  const values = await prepareSchoolOwnerWrite(input, input.userId);
  const [row] = await getDatabase().insert(schoolAssignments).values(values).returning();
  return row ? toAssignment(row) : null;
}

export async function updateSchoolAssignment(accountId: string, id: string, input: Partial<typeof schoolAssignments.$inferInsert>) {
  const values = await prepareSchoolOwnerWrite(input, accountId);
  const [row] = await getDatabase().update(schoolAssignments).set({ ...values, updatedAt: new Date() }).where(and(eq(schoolAssignments.userId, accountId), eq(schoolAssignments.id, id))).returning();
  return row ? toAssignment(row) : null;
}

export async function deleteSchoolAssignment(accountId: string, id: string) {
  const deleted = await getDatabase().delete(schoolAssignments).where(and(eq(schoolAssignments.userId, accountId), eq(schoolAssignments.id, id))).returning({ id: schoolAssignments.id });
  return deleted.length > 0;
}

/** Provider refreshes update only provider-owned columns; planning fields are intentionally omitted. */
export async function upsertCanvasAssignments(assignments: Array<typeof schoolAssignments.$inferInsert>) {
  return (await upsertCanvasAssignmentsWithResult(assignments)).assignments;
}

export interface CanvasAssignmentUpsertResult {
  assignments: SchoolPlanningAssignment[];
  created: number;
  updated: number;
  skipped: number;
  failed: number;
}

/**
 * Idempotent Canvas import. The conflict key is the provider identity, never
 * title or due date. Duplicate rows in one response are skipped before the
 * database write so a malformed provider response cannot inflate the result.
 */
export async function upsertCanvasAssignmentsWithResult(assignments: Array<typeof schoolAssignments.$inferInsert>): Promise<CanvasAssignmentUpsertResult> {
  if (!assignments.length) return { assignments: [], created: 0, updated: 0, skipped: 0, failed: 0 };
  const values = dedupeCanvasAssignmentRows(assignments); const skipped = assignments.length - values.length;
  const sourceType = values[0].sourceType;
  const existing = await getDatabase().select({ userId: schoolAssignments.userId, sourceType: schoolAssignments.sourceType, sourceId: schoolAssignments.sourceId, externalId: schoolAssignments.externalId }).from(schoolAssignments).where(and(eq(schoolAssignments.userId, values[0].userId), eq(schoolAssignments.sourceType, sourceType), inArray(schoolAssignments.externalId, values.map((item) => item.externalId).filter((item): item is string => Boolean(item)))));
  const existingKeys = new Set(existing.map((item) => canvasAssignmentIdentity(item)));
  const imported: SchoolPlanningAssignment[] = []; let created = 0; let updated = 0; let failed = 0;
  for (const assignment of values) {
    try {
      const prepared = await prepareSchoolOwnerWrite(assignment, assignment.userId);
      const row = (await getDatabase().insert(schoolAssignments).values(prepared).onConflictDoUpdate({
        target: [schoolAssignments.userId, schoolAssignments.sourceType, schoolAssignments.sourceId, schoolAssignments.externalId],
        set: { title: prepared.title, description: prepared.description ?? null, courseId: prepared.courseId ?? null, courseName: prepared.courseName ?? null, dueAt: prepared.dueAt ?? null, availableAt: prepared.availableAt ?? null, lockAt: prepared.lockAt ?? null, completionStatus: prepared.completionStatus, pointsPossible: prepared.pointsPossible ?? null, published: prepared.published ?? null, canvasUrl: prepared.canvasUrl ?? null, provenance: prepared.provenance ?? null, sourceUpdatedAt: prepared.sourceUpdatedAt ?? null, lastSyncedAt: prepared.lastSyncedAt ?? null, updatedAt: new Date() },
      }).returning())[0];
      if (!row) { failed += 1; continue; }
      imported.push(toAssignment(row));
      const key = canvasAssignmentIdentity(assignment);
      if (existingKeys.has(key)) updated += 1; else { created += 1; existingKeys.add(key); }
    } catch {
      failed += 1;
    }
  }
  return { assignments: imported, created, updated, skipped, failed };
}
