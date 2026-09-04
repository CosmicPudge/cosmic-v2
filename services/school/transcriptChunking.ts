export const TRANSCRIPT_CHUNK_THRESHOLD = 24_000;
// Observed Cloudflare FP8 structured extraction: ~10.5k input characters can
// reach the 30-second timeout, so School keeps individual AI requests bounded.
export const TRANSCRIPT_CHUNK_TARGET = 5_000;
export const TRANSCRIPT_CHUNK_MAX = 6_000;
export const TRANSCRIPT_CHUNK_OVERLAP = 400;
export const TRANSCRIPT_MAX_CHUNKS = 12;

export type TranscriptChunk = { chunkIndex: number; chunkCount: number; startOffset: number; endOffset: number; overlapBefore: number; text: string };

function boundary(text: string, start: number, target: number) {
  const limit = Math.min(text.length, start + TRANSCRIPT_CHUNK_MAX);
  const preferred = Math.min(text.length, start + target);
  for (const marker of ["\n\n", ". ", "? ", "! ", "\n", " "]) {
    const position = text.lastIndexOf(marker, limit);
    if (position >= preferred - 1 && position > start) return position + marker.length;
  }
  return limit;
}

export function chunkSchoolTranscript(text: string): TranscriptChunk[] {
  if (!text) return [];
  const chunks: Array<Omit<TranscriptChunk, "chunkIndex" | "chunkCount">> = [];
  let start = 0;
  while (start < text.length) {
    const end = boundary(text, start, TRANSCRIPT_CHUNK_TARGET);
    chunks.push({ startOffset: start, endOffset: end, overlapBefore: chunks.length ? Math.min(TRANSCRIPT_CHUNK_OVERLAP, end - start) : 0, text: text.slice(start, end) });
    if (end >= text.length) break;
    start = Math.max(start + 1, end - TRANSCRIPT_CHUNK_OVERLAP);
  }
  const count = chunks.length;
  return chunks.map((chunk, index) => ({ ...chunk, chunkIndex: index + 1, chunkCount: count }));
}

export function transcriptExceedsChunkLimit(text: string) { return chunkSchoolTranscript(text).length > TRANSCRIPT_MAX_CHUNKS; }
