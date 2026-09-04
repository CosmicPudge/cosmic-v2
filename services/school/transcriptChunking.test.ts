import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the extension explicitly.
import { chunkSchoolTranscript, transcriptExceedsChunkLimit, TRANSCRIPT_CHUNK_OVERLAP, TRANSCRIPT_CHUNK_TARGET } from "./transcriptChunking.ts";

test("chunking preserves ordered text with bounded overlap", () => {
  const input = Array.from({ length: 36_705 }, (_, index) => index % 97 === 0 ? ". " : "x").join("");
  const chunks = chunkSchoolTranscript(input);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.length > 4 && chunks.length <= 12);
  assert.ok(chunks.every((chunk) => chunk.text.length <= 6_000));
  assert.equal(chunks[0].startOffset, 0);
  assert.equal(chunks.at(-1)?.endOffset, input.length);
  for (let index = 1; index < chunks.length; index += 1) {
    assert.equal(chunks[index].startOffset, chunks[index - 1].endOffset - TRANSCRIPT_CHUNK_OVERLAP);
  }
  assert.ok(chunks[0].text.length >= TRANSCRIPT_CHUNK_TARGET);
});

test("chunk metadata is deterministic for a boundary sentence", () => {
  const input = "a".repeat(8_995) + " The final project report is due Friday at 11:59 PM." + "b".repeat(2_000);
  const chunks = chunkSchoolTranscript(input);
  assert.equal(chunks[0].chunkIndex, 1);
  assert.equal(chunks[0].chunkCount, chunks.length);
  assert.ok(chunks.some((chunk) => chunk.text.includes("final project report is due Friday at 11:59 PM")));
});

test("over-capacity transcripts are rejected without truncation", () => {
  const input = "lecture fact. ".repeat(90_000);
  const chunks = chunkSchoolTranscript(input);
  assert.ok(transcriptExceedsChunkLimit(input));
  assert.ok(chunks.length > 8);
  assert.equal(chunks.at(-1)?.endOffset, input.length);
});
