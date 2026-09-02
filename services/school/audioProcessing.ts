import { getSchoolAssetById } from "./assetRepository";
import { getSchoolAssetStore } from "./sources/storage";
import { getSchoolAudioTranscript, updateSchoolAudioTranscript } from "./audioRepository";
import { getSchoolSource, updateSchoolSourceRecord } from "./sources/repository";
import { organizeSchoolTranscript } from "./audioOrganizer";
import { transcribeSchoolAudio, validateSchoolAudio, type SchoolAudioMimeType } from "./audio";

function safeError(error: unknown) { return error instanceof Error ? error.message.replace(/\s+/g, " ").slice(0, 240) : "Audio processing failed."; }
export async function processSchoolAudio(accountId: string, transcriptId: string) {
  const job = await getSchoolAudioTranscript(accountId, transcriptId); if (!job) return null;
  const source = await getSchoolSource(accountId, job.sourceId); const asset = await getSchoolAssetById(accountId, job.assetId);
  if (!source || !asset) throw new Error("Recording is unavailable.");
  if (!job.transcript) {
    await updateSchoolAudioTranscript(accountId, job.id, { status: "transcribing", processingError: null }); await updateSchoolSourceRecord(accountId, source.id, { processingStatus: "processing", processingError: null });
    try { const bytes = await getSchoolAssetStore().get({ accountId, key: asset.storageKey }); if (!bytes) throw new Error("Recording is unavailable."); const mime = validateSchoolAudio({ type: asset.mimeType, name: asset.originalFileName, size: asset.size }, bytes) as SchoolAudioMimeType; const result = await transcribeSchoolAudio({ bytes, mimeType: mime, fileName: asset.safeFileName }); await updateSchoolAudioTranscript(accountId, job.id, { transcript: result.transcript, segments: result.segments ?? null, provider: result.provider, model: result.model, status: "transcribed", processingError: null });
    } catch (error) { const message = safeError(error); await updateSchoolAudioTranscript(accountId, job.id, { status: "failed", processingError: message }); await updateSchoolSourceRecord(accountId, source.id, { processingStatus: "failed", processingError: "Recording saved; transcription failed. Retry processing." }); return getSchoolAudioTranscript(accountId, job.id); }
  }
  const current = await getSchoolAudioTranscript(accountId, job.id); if (!current?.transcript) return current;
  if (!current.organizedContent) { await updateSchoolAudioTranscript(accountId, job.id, { status: "organizing", processingError: null }); try { const organized = await organizeSchoolTranscript({ transcript: current.transcript }); await updateSchoolAudioTranscript(accountId, job.id, { title: organized.title, organizedContent: organized.content, organizedTopics: organized.topics, status: "ready-for-review", processingError: null }); await updateSchoolSourceRecord(accountId, source.id, { processingStatus: "needs_review", processingError: null, extractedText: current.transcript }); } catch (error) { const message = safeError(error); await updateSchoolAudioTranscript(accountId, job.id, { status: "failed", processingError: message }); await updateSchoolSourceRecord(accountId, source.id, { processingStatus: "failed", processingError: "Recording saved; organization failed. Transcript retained for retry." }); } }
  return getSchoolAudioTranscript(accountId, job.id);
}
