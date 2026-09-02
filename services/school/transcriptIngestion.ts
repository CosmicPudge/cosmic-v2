import "server-only";
import { createSchoolAudioTranscript } from "./audioRepository";
import { createSchoolSourceRecord } from "./sources/repository";
import { processSchoolAudio } from "./audioProcessing";

export type SchoolTranscriptSourceType = "apple_voice_memos_transcript" | "manual_transcript" | "other_transcript";

export async function createSchoolTranscriptIngestion(input: { accountId: string; transcript: string; title?: string; courseId?: string | null; sourceType: SchoolTranscriptSourceType; sourceLabel: string }) {
  const transcript = input.transcript.trim().slice(0, 120_000);
  if (transcript.length < 20) throw new Error("Paste a transcript with at least 20 characters.");
  const sourceId = crypto.randomUUID();
  const transcriptId = crypto.randomUUID();
  const title = input.title?.trim().slice(0, 500) || "Transcript study note";
  await createSchoolSourceRecord({ id: sourceId, userId: input.accountId, title, sourceType: input.sourceType, courseId: input.courseId || null, notes: input.sourceLabel, extractedText: transcript, processingStatus: "uploaded" });
  await createSchoolAudioTranscript({ id: transcriptId, userId: input.accountId, sourceId, courseId: input.courseId || null, sourceType: input.sourceType, sourceLabel: input.sourceLabel, transcript, title, status: "transcribed", audioCleanupStatus: "not_applicable" });
  return processSchoolAudio(input.accountId, transcriptId);
}
