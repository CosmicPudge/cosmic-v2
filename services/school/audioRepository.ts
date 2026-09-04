import "server-only";
import { and, desc, eq, isNotNull, ne } from "drizzle-orm";
import { getDatabase } from "@/services/database/client";
import { schoolAssignments, schoolAudioTranscripts, schoolAssets, schoolCanvasCalendarEvents, schoolEmailProposals, schoolFindings, schoolNotes, schoolSources } from "@/services/database/schema";
export type SchoolAudioTranscript = typeof schoolAudioTranscripts.$inferSelect;
export async function getSchoolAudioTranscript(accountId: string, id: string) { return (await getDatabase().select().from(schoolAudioTranscripts).where(and(eq(schoolAudioTranscripts.userId, accountId), eq(schoolAudioTranscripts.id, id))).limit(1))[0] ?? null; }
export async function getSchoolAudioTranscriptBySource(accountId: string, sourceId: string) { return (await getDatabase().select().from(schoolAudioTranscripts).where(and(eq(schoolAudioTranscripts.userId, accountId), eq(schoolAudioTranscripts.sourceId, sourceId))).limit(1))[0] ?? null; }
export async function listSchoolTranscriptReviews(accountId: string) { return getDatabase().select({ transcript: schoolAudioTranscripts, sourceTitle: schoolSources.title, sourceCourseId: schoolSources.courseId }).from(schoolAudioTranscripts).leftJoin(schoolSources, and(eq(schoolSources.id, schoolAudioTranscripts.sourceId), eq(schoolSources.userId, accountId))).where(and(eq(schoolAudioTranscripts.userId, accountId), ne(schoolAudioTranscripts.status, "approved"), isNotNull(schoolAudioTranscripts.transcript))).orderBy(desc(schoolAudioTranscripts.updatedAt)); }
export async function createSchoolAudioTranscript(input: typeof schoolAudioTranscripts.$inferInsert) { return (await getDatabase().insert(schoolAudioTranscripts).values(input).returning())[0] ?? null; }
export async function updateSchoolAudioTranscript(accountId: string, id: string, input: Partial<typeof schoolAudioTranscripts.$inferInsert>) { return (await getDatabase().update(schoolAudioTranscripts).set({ ...input, updatedAt: new Date() }).where(and(eq(schoolAudioTranscripts.userId, accountId), eq(schoolAudioTranscripts.id, id))).returning())[0] ?? null; }
export async function deleteSchoolAudioTranscript(accountId: string, id: string) { return (await getDatabase().delete(schoolAudioTranscripts).where(and(eq(schoolAudioTranscripts.userId, accountId), eq(schoolAudioTranscripts.id, id))).returning({ id: schoolAudioTranscripts.id }))[0] ?? null; }
export async function deleteUnapprovedSchoolTranscript(accountId: string, transcriptId: string, beforeDelete?: () => Promise<void>) {
  const database = getDatabase();
  const transcript = await getSchoolAudioTranscript(accountId, transcriptId);
  if (!transcript) return { status: "not_found" as const };
  if (transcript.status === "approved") return { status: "approved" as const };
  const source = (await database.select({ id: schoolSources.id }).from(schoolSources).where(and(eq(schoolSources.userId, accountId), eq(schoolSources.id, transcript.sourceId))).limit(1))[0];
  if (!source) return { status: "not_found" as const };
  const [notes, findings, assignments, events, proposals] = await Promise.all([
    database.select({ id: schoolNotes.id }).from(schoolNotes).where(and(eq(schoolNotes.userId, accountId), eq(schoolNotes.sourceId, source.id))),
    database.select({ id: schoolFindings.id }).from(schoolFindings).where(and(eq(schoolFindings.userId, accountId), eq(schoolFindings.sourceId, source.id))),
    database.select({ id: schoolAssignments.id }).from(schoolAssignments).where(and(eq(schoolAssignments.userId, accountId), eq(schoolAssignments.sourceId, source.id))),
    database.select({ id: schoolCanvasCalendarEvents.id }).from(schoolCanvasCalendarEvents).where(and(eq(schoolCanvasCalendarEvents.userId, accountId), eq(schoolCanvasCalendarEvents.sourceId, source.id))),
    database.select({ id: schoolEmailProposals.id }).from(schoolEmailProposals).where(and(eq(schoolEmailProposals.userId, accountId), eq(schoolEmailProposals.sourceId, source.id))),
  ]);
  const dependencies = { notes: notes.length, findings: findings.length, assignments: assignments.length, events: events.length, proposals: proposals.length };
  if (Object.values(dependencies).some((count) => count > 0)) return { status: "blocked" as const, dependencies };
  if (beforeDelete) await beforeDelete();
  await database.transaction(async (tx) => {
    await tx.delete(schoolAudioTranscripts).where(and(eq(schoolAudioTranscripts.userId, accountId), eq(schoolAudioTranscripts.id, transcript.id)));
    await tx.delete(schoolAssets).where(and(eq(schoolAssets.userId, accountId), eq(schoolAssets.sourceId, source.id)));
    await tx.delete(schoolSources).where(and(eq(schoolSources.userId, accountId), eq(schoolSources.id, source.id)));
  });
  return { status: "deleted" as const, sourceId: source.id, assetId: transcript.assetId };
}
