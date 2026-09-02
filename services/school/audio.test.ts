import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { MAX_SCHOOL_AUDIO_BYTES, validateSchoolAudio } from "./audio.ts";

function bytes(value: string) { return new TextEncoder().encode(value); }

test("accepts supported audio signatures", () => {
  assert.equal(validateSchoolAudio({ type: "audio/mpeg", name: "lecture.mp3", size: 4 }, bytes("ID3 audio")), "audio/mpeg");
  assert.equal(validateSchoolAudio({ type: "audio/wav", name: "lecture.wav", size: 12 }, new Uint8Array([...bytes("RIFF"), 0, 0, 0, 0, ...bytes("WAVE")])), "audio/wav");
  assert.equal(validateSchoolAudio({ type: "", name: "lecture.ogg", size: 4 }, bytes("OggS audio")), "audio/ogg");
});

test("accepts browser and phone MIME variants using the actual signature", () => {
  assert.equal(validateSchoolAudio({ type: "audio/webm;codecs=opus", name: "lecture.webm", size: 4 }, new Uint8Array([0x1a, 0x45, 0xdf, 0xa3])), "audio/webm");
  assert.equal(validateSchoolAudio({ type: "application/octet-stream", name: "lecture.bin", size: 4 }, new Uint8Array([0x1a, 0x45, 0xdf, 0xa3])), "audio/webm");
  assert.equal(validateSchoolAudio({ type: "audio/ogg;codecs=opus", name: "lecture.ogg", size: 4 }, bytes("OggS")), "audio/ogg");
  assert.equal(validateSchoolAudio({ type: "audio/m4a", name: "lecture.m4a", size: 12 }, new Uint8Array([0, 0, 0, 0, ...bytes("ftyp"), 0, 0, 0, 0])), "audio/mp4");
  assert.equal(validateSchoolAudio({ type: "audio/mp3", name: "lecture.mp3", size: 3 }, bytes("ID3")), "audio/mpeg");
  assert.equal(validateSchoolAudio({ type: "audio/mp4", name: "lecture.m4a", size: 12 }, new Uint8Array([0, 0, 0, 0, ...bytes("ftyp"), 0, 0, 0, 0])), "audio/mp4");
});

test("rejects unsupported, oversized, and mislabeled recordings", () => {
  assert.throws(() => validateSchoolAudio({ type: "application/pdf", name: "lecture.pdf", size: 1 }));
  assert.throws(() => validateSchoolAudio({ type: "audio/mpeg", name: "lecture.mp3", size: MAX_SCHOOL_AUDIO_BYTES + 1 }));
  assert.throws(() => validateSchoolAudio({ type: "audio/mpeg", name: "lecture.mp3", size: 4 }, bytes("not audio")));
  assert.throws(() => validateSchoolAudio({ type: "audio/mpeg", name: "empty.mp3", size: 0 }, new Uint8Array()));
});
