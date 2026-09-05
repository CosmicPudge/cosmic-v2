import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { extractSourceText, hasReadableExtractedText, isSupportedSchoolSourceType, validateSourceType } from "./extractText.ts";

function textPdf(pages: string[][]): Buffer {
  const objects: string[] = []; const pageIds = pages.map((_, index) => 3 + index * 2); const contentIds = pages.map((_, index) => 4 + index * 2); const fontId = 3 + pages.length * 2;
  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`; objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  pages.forEach((lines, index) => { const content = `BT /F1 12 Tf 72 720 Td ${lines.map((line, lineIndex) => `${lineIndex ? "0 -18 Td " : ""}(${line.replace(/[()\\]/g, "\\$&")}) Tj`).join(" ")} ET`; objects[pageIds[index]] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentIds[index]} 0 R >>`; objects[contentIds[index]] = `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`; }); objects[fontId] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;
  let pdf = "%PDF-1.7\n"; const offsets: number[] = [0]; for (let id = 1; id <= fontId; id += 1) { offsets[id] = Buffer.byteLength(pdf, "latin1"); pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`; } const xref = Buffer.byteLength(pdf, "latin1"); pdf += `xref\n0 ${fontId + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${fontId + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`; return Buffer.from(pdf, "latin1");
}
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

test("extracts readable text page-by-page with stable line reconstruction", async () => {
  const text = await extractSourceText({ buffer: textPdf([["TEST AFROTC DETACHMENT", "Week 02 SPMT OPORD"], ["Date/Time", "Wednesday (9 Sep 2026) from 0600-0700", "Form-Up Location", "Test Field"]]), mimeType: "application/pdf", fileName: "opord.pdf" });
  assert.match(text, /TEST AFROTC DETACHMENT/);
  assert.match(text, /--- PAGE 1 ---[\s\S]*--- PAGE 2 ---/);
  assert.match(text, /Date\/Time/);
});

test("keeps the quality guard fail-closed for raw, malformed, and no-text PDFs", async () => {
  assert.equal(hasReadableExtractedText("%PDF-1.7 xref endobj"), false);
  await assert.rejects(() => extractSourceText({ buffer: Buffer.from("not a pdf"), mimeType: "application/pdf", fileName: "bad.pdf" }), /Unable to extract readable text|Invalid PDF/);
  await assert.rejects(() => extractSourceText({ buffer: textPdf([[" "]]), mimeType: "application/pdf", fileName: "empty.pdf" }), /Unable to extract readable text/);
});

test("classifies database failures without exposing SQL or params", () => {
  assert.deepEqual(safeDatabaseFailure({ code: "23514", constraint: "school_sources_type_check", detail: "private SQL and params" }), { dbCode: "23514", constraint: "school_sources_type_check", column: undefined });
  assert.deepEqual(safeDatabaseFailure(new Error("database failed")), { dbCode: "unknown", constraint: undefined, column: undefined });
});
