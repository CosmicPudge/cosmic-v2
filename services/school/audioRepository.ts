import "server-only";
import { and, eq } from "drizzle-orm";
import { getDatabase } from "@/services/database/client";
import { schoolAudioTranscripts } from "@/services/database/schema";
export type SchoolAudioTranscript = typeof schoolAudioTranscripts.$inferSelect;
export async function getSchoolAudioTranscript(accountId: string, id: string) { return (await getDatabase().select().from(schoolAudioTranscripts).where(and(eq(schoolAudioTranscripts.userId, accountId), eq(schoolAudioTranscripts.id, id))).limit(1))[0] ?? null; }
export async function getSchoolAudioTranscriptBySource(accountId: string, sourceId: string) { return (await getDatabase().select().from(schoolAudioTranscripts).where(and(eq(schoolAudioTranscripts.userId, accountId), eq(schoolAudioTranscripts.sourceId, sourceId))).limit(1))[0] ?? null; }
export async function createSchoolAudioTranscript(input: typeof schoolAudioTranscripts.$inferInsert) { return (await getDatabase().insert(schoolAudioTranscripts).values(input).returning())[0] ?? null; }
export async function updateSchoolAudioTranscript(accountId: string, id: string, input: Partial<typeof schoolAudioTranscripts.$inferInsert>) { return (await getDatabase().update(schoolAudioTranscripts).set({ ...input, updatedAt: new Date() }).where(and(eq(schoolAudioTranscripts.userId, accountId), eq(schoolAudioTranscripts.id, id))).returning())[0] ?? null; }
