import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { getDatabase } from "@/services/database/client";
import { schoolAssignments } from "@/services/database/schema";
import type { SchoolPlanningAssignment } from "@/core/contracts/SchoolPlanning";

export type SchoolAssignmentRow = typeof schoolAssignments.$inferSelect;

function toAssignment(row: SchoolAssignmentRow): SchoolPlanningAssignment {
  return {
    id: row.id, accountId: row.userId, title: row.title,
    ...(row.description ? { description: row.description } : {}), ...(row.courseId ? { courseId: row.courseId } : {}), ...(row.courseName ? { courseName: row.courseName } : {}),
    sourceType: row.sourceType as SchoolPlanningAssignment["sourceType"], ...(row.sourceId ? { sourceId: row.sourceId } : {}), ...(row.externalId ? { externalId: row.externalId } : {}),
    ...(row.dueAt ? { dueAt: row.dueAt } : {}), ...(row.availableAt ? { availableAt: row.availableAt } : {}), ...(row.lockAt ? { lockAt: row.lockAt } : {}),
    completionStatus: row.completionStatus as SchoolPlanningAssignment["completionStatus"], planningStatus: row.planningStatus as SchoolPlanningAssignment["planningStatus"], priority: row.priority as SchoolPlanningAssignment["priority"],
    ...(row.estimatedMinutes !== null ? { estimatedMinutes: row.estimatedMinutes } : {}), ...(row.pointsPossible !== null ? { pointsPossible: row.pointsPossible } : {}), ...(row.published !== null ? { published: row.published } : {}), ...(row.canvasUrl ? { canvasUrl: row.canvasUrl } : {}), ...(row.personalNotes ? { personalNotes: row.personalNotes } : {}), ...(row.provenance ? { provenance: row.provenance as SchoolPlanningAssignment["provenance"] } : {}),
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
  const [row] = await getDatabase().insert(schoolAssignments).values(input).returning();
  return row ? toAssignment(row) : null;
}

export async function updateSchoolAssignment(accountId: string, id: string, input: Partial<typeof schoolAssignments.$inferInsert>) {
  const [row] = await getDatabase().update(schoolAssignments).set({ ...input, updatedAt: new Date() }).where(and(eq(schoolAssignments.userId, accountId), eq(schoolAssignments.id, id))).returning();
  return row ? toAssignment(row) : null;
}

export async function deleteSchoolAssignment(accountId: string, id: string) {
  const deleted = await getDatabase().delete(schoolAssignments).where(and(eq(schoolAssignments.userId, accountId), eq(schoolAssignments.id, id))).returning({ id: schoolAssignments.id });
  return deleted.length > 0;
}

/** Provider refreshes update only provider-owned columns; planning fields are intentionally omitted. */
export async function upsertCanvasAssignments(assignments: Array<typeof schoolAssignments.$inferInsert>) {
  if (!assignments.length) return [];
  const rows = await Promise.all(assignments.map((assignment) => getDatabase().insert(schoolAssignments).values(assignment).onConflictDoUpdate({
    target: [schoolAssignments.userId, schoolAssignments.sourceType, schoolAssignments.sourceId, schoolAssignments.externalId],
    set: { title: assignment.title, description: assignment.description, courseId: assignment.courseId, courseName: assignment.courseName, dueAt: assignment.dueAt, availableAt: assignment.availableAt, lockAt: assignment.lockAt, completionStatus: assignment.completionStatus, pointsPossible: assignment.pointsPossible, published: assignment.published, canvasUrl: assignment.canvasUrl, sourceUpdatedAt: assignment.sourceUpdatedAt, lastSyncedAt: assignment.lastSyncedAt, updatedAt: new Date() },
  }).returning()));
  return rows.flatMap((result) => result[0] ? [toAssignment(result[0])] : []);
}
