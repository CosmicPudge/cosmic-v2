import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { isSupportedSchoolSourceType, validateSourceType } from "./extractText.ts";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { safeDatabaseFailure } from "./dbDiagnostics.ts";

test("accepts canonical multimodal and legacy School source types", () => {
  assert.equal(validateSourceType("image/png", "notes.png"), "upload-image");
  assert.equal(validateSourceType("image/jpeg", "notes.jpg"), "upload-image");
  assert.equal(validateSourceType("image/webp", "notes.webp"), "upload-image");
  assert.equal(validateSourceType("application/vnd.openxmlformats-officedocument.wordprocessingml.document", "handout.docx"), "upload-docx");
  assert.equal(isSupportedSchoolSourceType("manual"), true);
  assert.equal(isSupportedSchoolSourceType("calendar"), true);
  assert.equal(isSupportedSchoolSourceType("upload-png"), false);
});

test("rejects spoofed or unsupported source types", () => {
  assert.throws(() => validateSourceType("image/svg+xml", "notes.svg"), /Unsupported source type/);
  assert.throws(() => validateSourceType("application/octet-stream", "notes.png"), /Unsupported source type/);
  assert.throws(() => validateSourceType("application/x-unknown", "notes.txt"), /Unsupported source type/);
});

test("uses an extension only when the declared MIME type is absent", () => {
  assert.equal(validateSourceType("", "notes.png"), "upload-image");
  assert.equal(validateSourceType("text/plain", "notes.png"), "upload-text");
});

test("classifies database failures without exposing SQL or params", () => {
  assert.deepEqual(safeDatabaseFailure({ code: "23514", constraint: "school_sources_type_check", detail: "private SQL and params" }), { dbCode: "23514", constraint: "school_sources_type_check", column: undefined });
  assert.deepEqual(safeDatabaseFailure(new Error("database failed")), { dbCode: "unknown", constraint: undefined, column: undefined });
});
