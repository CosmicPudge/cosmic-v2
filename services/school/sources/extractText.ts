import { normalizeSourceText } from "./normalizeText";
import { SCHOOL_SOURCE_TYPES, type SchoolSourceType } from "@/core/contracts/SchoolIntelligence";
import mammoth from "mammoth";

export const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
export const MAX_PDF_PAGES = 50;
export const MAX_EXTRACTED_TEXT_CHARS = 300_000;
const PDFJS_MODULE = "pdfjs-dist/legacy/build/pdf.mjs";
type PdfTextItem = { str: string; transform: number[]; height?: number };
export type SourceTextLayoutItem = { page: number; text: string; x: number; y: number; width: number };
export type ExtractedSource = { text: string; layout: SourceTextLayoutItem[] };

export function hasReadableExtractedText(text: string): boolean {
  const value = text.trim(); if (value.length < 20 || value.includes("%PDF-")) return false;
  const printableRatio = [...value].filter((character) => character === "\n" || character === "\t" || character.charCodeAt(0) >= 32).length / value.length;
  if (printableRatio < 0.92) return false;
  if (/\b(?:endstream|endobj|xref|ObjStm)\b/.test(value) && /[\u0000-\u0008\u000e-\u001f]/.test(value)) return false;
  return true;
}

async function extractPdfText(buffer: Buffer): Promise<ExtractedSource> {
  const { getDocument } = await import(PDFJS_MODULE);
  const loadingTask = getDocument({ data: new Uint8Array(buffer), disableAutoFetch: true, disableStream: true, disableFontFace: true, useWorkerFetch: false, isEvalSupported: false, verbosity: 0 });
  try {
    const document = await loadingTask.promise; const pageTexts: string[] = []; const layout: SourceTextLayoutItem[] = [];
    if (document.numPages > MAX_PDF_PAGES) throw new Error(`PDF exceeds the ${MAX_PDF_PAGES} page limit.`);
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber); const content = await page.getTextContent();
      const items: { text: string; x: number; y: number; width: number; height: number }[] = content.items.filter((item: unknown): item is PdfTextItem => typeof item === "object" && item !== null && "str" in item && typeof item.str === "string" && "transform" in item && Array.isArray(item.transform)).map((item: PdfTextItem) => ({ text: item.str, x: item.transform[4], y: item.transform[5], width: typeof (item as PdfTextItem & { width?: unknown }).width === "number" ? (item as PdfTextItem & { width: number }).width : Math.max(1, item.str.length * (item.height ?? Math.abs(item.transform[3])) * 0.45), height: item.height ?? Math.abs(item.transform[3]) }));
      layout.push(...items.map((item) => ({ page: pageNumber, text: item.text, x: item.x, y: item.y, width: item.width })));
      const lines: { y: number; height: number; items: typeof items }[] = [];
      for (const item of items) { const line = lines.find((candidate) => Math.abs(candidate.y - item.y) <= Math.max(2, Math.min(5, item.height * 0.45))); if (line) { line.items.push(item); line.y = (line.y * (line.items.length - 1) + item.y) / line.items.length; line.height = Math.max(line.height, item.height); } else lines.push({ y: item.y, height: item.height, items: [item] }); }
      lines.sort((left, right) => right.y - left.y); const text = lines.map((line) => line.items.sort((left, right) => left.x - right.x).map((item, index, row) => index === 0 ? item.text : `${row[index - 1].text.endsWith(" ") || item.text.startsWith(" ") ? "" : " "}${item.text}`).join("").trim()).filter(Boolean).join("\n");
      pageTexts.push(`--- PAGE ${pageNumber} ---\n${text}`);
      if (pageTexts.join("\n").length > MAX_EXTRACTED_TEXT_CHARS) throw new Error(`PDF text exceeds the ${MAX_EXTRACTED_TEXT_CHARS} character limit.`);
      page.cleanup();
    }
    return { text: pageTexts.join("\n"), layout };
  } finally { await loadingTask.destroy(); }
}

export async function extractSourceText(input: { buffer: Buffer; mimeType: string; fileName?: string }): Promise<string> {
  if (input.buffer.byteLength > MAX_SOURCE_BYTES) throw new Error("Source exceeds the 10 MB size limit.");
  const isPdf = input.mimeType === "application/pdf" || input.fileName?.toLowerCase().endsWith(".pdf");
  const isDocx = input.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || input.fileName?.toLowerCase().endsWith(".docx");
  const text = isDocx ? (await mammoth.extractRawText({ buffer: input.buffer })).value : isPdf ? (await extractPdfText(input.buffer)).text : input.buffer.toString("utf8");
  const normalized = normalizeSourceText(text);
  if (!hasReadableExtractedText(normalized)) throw new Error("Unable to extract readable text from this source.");
  return normalized;
}

export async function extractSourceContent(input: { buffer: Buffer; mimeType: string; fileName?: string }): Promise<ExtractedSource> {
  if (input.buffer.byteLength > MAX_SOURCE_BYTES) throw new Error("Source exceeds the 10 MB size limit.");
  const isPdf = input.mimeType === "application/pdf" || input.fileName?.toLowerCase().endsWith(".pdf");
  const isDocx = input.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || input.fileName?.toLowerCase().endsWith(".docx");
  const extracted = isPdf ? await extractPdfText(input.buffer) : { text: isDocx ? (await mammoth.extractRawText({ buffer: input.buffer })).value : input.buffer.toString("utf8"), layout: [] };
  const text = normalizeSourceText(extracted.text);
  if (!hasReadableExtractedText(text)) throw new Error("Unable to extract readable text from this source.");
  return { text, layout: extracted.layout };
}

export function validateSourceType(mimeType: string, fileName = ""): Extract<SchoolSourceType, "upload-pdf" | "upload-text" | "upload-image" | "upload-docx"> {
  const declaredMime = mimeType.trim().toLowerCase();
  const hasDeclaredMime = declaredMime.length > 0;
  if (declaredMime === "application/pdf" || (!hasDeclaredMime && fileName.toLowerCase().endsWith(".pdf"))) return "upload-pdf";
  if (["text/plain", "text/markdown", "text/x-markdown"].includes(declaredMime) || (!hasDeclaredMime && /\.(txt|md)$/i.test(fileName))) return "upload-text";
  if (["image/png", "image/jpeg", "image/webp"].includes(declaredMime) || (!hasDeclaredMime && /\.(png|jpe?g|webp)$/i.test(fileName))) return "upload-image";
  if (declaredMime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || (!hasDeclaredMime && fileName.toLowerCase().endsWith(".docx"))) return "upload-docx";
  throw new Error("Unsupported source type. Upload a PDF, DOCX, image, TXT, Markdown, or audio recording.");
}

export function isSupportedSchoolSourceType(value: string): value is SchoolSourceType { return SCHOOL_SOURCE_TYPES.includes(value as SchoolSourceType); }
