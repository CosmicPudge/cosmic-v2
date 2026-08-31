import "server-only";
import { desc, eq, and } from "drizzle-orm";
import { getDatabase } from "@/services/database/client";
import { schoolSources } from "@/services/database/schema";

export type SchoolSourceRow = typeof schoolSources.$inferSelect;

export async function listSchoolSources(accountId: string) { return getDatabase().select().from(schoolSources).where(eq(schoolSources.userId, accountId)).orderBy(desc(schoolSources.updatedAt)); }
export async function getSchoolSource(accountId: string, id: string) { return (await getDatabase().select().from(schoolSources).where(and(eq(schoolSources.userId, accountId), eq(schoolSources.id, id))).limit(1))[0] ?? null; }
export async function createSchoolSourceRecord(input: typeof schoolSources.$inferInsert) { return (await getDatabase().insert(schoolSources).values(input).returning())[0]; }
export async function updateSchoolSourceRecord(accountId: string, id: string, input: Partial<typeof schoolSources.$inferInsert>) { return (await getDatabase().update(schoolSources).set({ ...input, updatedAt: new Date() }).where(and(eq(schoolSources.userId, accountId), eq(schoolSources.id, id))).returning())[0] ?? null; }
export async function deleteSchoolSourceRecord(accountId: string, id: string) { return (await getDatabase().delete(schoolSources).where(and(eq(schoolSources.userId, accountId), eq(schoolSources.id, id))).returning({ id: schoolSources.id }))[0] ?? null; }
