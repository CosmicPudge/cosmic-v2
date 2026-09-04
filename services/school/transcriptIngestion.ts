import "server-only";
import { createSchoolAudioTranscript, getSchoolAudioTranscriptBySource } from "./audioRepository";
import { createSchoolSourceRecord, getSchoolSource } from "./sources/repository";
import { processSchoolAudio } from "./audioProcessing";
import type { SchoolTranscriptSourceType } from "./sourceTypes";
export type { SchoolTranscriptSourceType } from "./sourceTypes";

export async function createSchoolTranscriptIngestion(input: { accountId: string; idempotencyKey: string; transcript: string; title?: string; courseId?: string | null; sourceType: SchoolTranscriptSourceType; sourceLabel: string }) {
  const transcript = input.transcript.trim().slice(0, 120_000);
  if (transcript.length < 20) throw new Error("Paste a transcript with at least 20 characters.");
  const sourceId = input.idempotencyKey;
  const transcriptId = `${input.idempotencyKey}-transcript`;
  const title = input.title?.trim().slice(0, 500) || "Transcript study note";
  if (!await getSchoolSource(input.accountId, sourceId)) await createSchoolSourceRecord({ id: sourceId, userId: input.accountId, title, sourceType: input.sourceType, courseId: input.courseId || null, notes: input.sourceLabel, extractedText: transcript, processingStatus: "uploaded" });
  const existingTranscript = await getSchoolAudioTranscriptBySource(input.accountId, sourceId);
  const savedTranscript = existingTranscript ?? await createSchoolAudioTranscript({ id: transcriptId, userId: input.accountId, sourceId, courseId: input.courseId || null, sourceType: input.sourceType, sourceLabel: input.sourceLabel, transcript, title, status: "transcribed", audioCleanupStatus: "not_applicable" });
  if (!savedTranscript) throw new Error("Transcript could not be persisted.");
  return processSchoolAudio(input.accountId, savedTranscript.id);
}
