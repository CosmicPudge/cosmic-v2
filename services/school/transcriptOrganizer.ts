import { organizeSchoolTranscriptSinglePass, type OrganizedAudioNote } from "./audioOrganizer";
import { aggregateTranscriptExtractions } from "./transcriptAggregation";
import { chunkSchoolTranscript, transcriptExceedsChunkLimit, TRANSCRIPT_CHUNK_MAX, TRANSCRIPT_CHUNK_OVERLAP, TRANSCRIPT_CHUNK_TARGET, TRANSCRIPT_CHUNK_THRESHOLD } from "./transcriptChunking";
import { extractTranscriptChunk } from "./transcriptChunkParser";

export type { OrganizedAudioNote };
export async function organizeSchoolTranscript(input: { transcript: string; courseContext?: string; transcriptId?: string }): Promise<OrganizedAudioNote> {
  const threshold = Number(process.env.SCHOOL_TRANSCRIPT_CHUNK_THRESHOLD) || TRANSCRIPT_CHUNK_THRESHOLD;
  if (input.transcript.length <= threshold) return organizeSchoolTranscriptSinglePass(input);
  const chunks = chunkSchoolTranscript(input.transcript);
  if (transcriptExceedsChunkLimit(input.transcript)) throw new Error("This transcript is too long to organize automatically right now. The original transcript is still saved.");
  if (process.env.NODE_ENV !== "test") console.info("school_transcript_chunking", { operation: "school_transcript_chunking", transcriptId: input.transcriptId, inputCharacterCount: input.transcript.length, strategy: "sequential_structured_extraction", threshold, chunkTarget: TRANSCRIPT_CHUNK_TARGET, chunkMax: TRANSCRIPT_CHUNK_MAX, overlap: TRANSCRIPT_CHUNK_OVERLAP, chunkCount: chunks.length });
  const extractions = [];
  const startedAt = Date.now();
  for (const chunk of chunks) {
    const requestStartedAt = Date.now();
    const result = await extractTranscriptChunk(chunk, input.transcriptId);
    extractions.push(result.extraction);
    if (process.env.NODE_ENV !== "test") console.info("school_transcript_chunk_result", { operation: "school_transcript_chunk_result", transcriptId: input.transcriptId, chunkIndex: chunk.chunkIndex, responseCharacterCount: result.responseCharacterCount, parseStatus: "passed", schemaStatus: "passed", durationMs: Date.now() - requestStartedAt });
  }
  const aggregate = aggregateTranscriptExtractions(extractions);
  const aggregateText = JSON.stringify(aggregate);
  if (process.env.NODE_ENV !== "test") console.info("school_transcript_merge", { operation: "school_transcript_merge", transcriptId: input.transcriptId, chunkCount: chunks.length, aggregateCharacterCount: aggregateText.length, durationMs: Date.now() - startedAt });
  return organizeSchoolTranscriptSinglePass({ courseContext: input.courseContext, transcriptId: input.transcriptId, transcript: `<structured_transcript_extraction>\n${aggregateText}\n</structured_transcript_extraction>` });
}
