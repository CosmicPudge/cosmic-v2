import "server-only";
import { and, eq } from "drizzle-orm";
import { getDatabase } from "@/services/database/client";
import { schoolCoursePlanOverrides } from "@/services/database/schema";

export type SchoolCoursePlanOverride = typeof schoolCoursePlanOverrides.$inferSelect;
export async function listCoursePlanOverrides(accountId: string, courseId?: string) {
  return getDatabase().select().from(schoolCoursePlanOverrides).where(courseId ? and(eq(schoolCoursePlanOverrides.accountId, accountId), eq(schoolCoursePlanOverrides.courseId, courseId)) : eq(schoolCoursePlanOverrides.accountId, accountId));
}
export async function upsertCoursePlanOverride(input: typeof schoolCoursePlanOverrides.$inferInsert) {
  return (await getDatabase().insert(schoolCoursePlanOverrides).values(input).onConflictDoUpdate({ target: [schoolCoursePlanOverrides.accountId, schoolCoursePlanOverrides.courseId, schoolCoursePlanOverrides.semanticField, schoolCoursePlanOverrides.targetId], set: { value: input.value, note: input.note, updatedAt: new Date(), provenance: "manual" } }).returning())[0];
}
export async function removeCoursePlanOverride(accountId: string, courseId: string, semanticField: string, targetId = "primary") {
  return (await getDatabase().delete(schoolCoursePlanOverrides).where(and(eq(schoolCoursePlanOverrides.accountId, accountId), eq(schoolCoursePlanOverrides.courseId, courseId), eq(schoolCoursePlanOverrides.semanticField, semanticField), eq(schoolCoursePlanOverrides.targetId, targetId))).returning({ id: schoolCoursePlanOverrides.id }))[0] ?? null;
}
