import { normalizeSourceText } from "./normalizeText";
import { SCHOOL_SOURCE_TYPES, type SchoolSourceType } from "@/core/contracts/SchoolIntelligence";
import mammoth from "mammoth";

export const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

function extractPdfText(buffer: Buffer): string {
  // This is intentionally conservative. It reads common text literals only;
  // scanned/image-only PDFs fail instead of receiving fabricated intelligence.
  const binary = buffer.toString("latin1");
  const literals = [...binary.matchAll(/\(([^()\\]*(?:\\.[^()\\]*)*)\)/g)].map((match) => match[1].replace(/\\([\\()\\])/g, "$1").replace(/\\n/g, "\n").replace(/\\r/g, "\r"));
  return normalizeSourceText(literals.join("\n"));
}

export async function extractSourceText(input: { buffer: Buffer; mimeType: string; fileName?: string }): Promise<string> {
  if (input.buffer.byteLength > MAX_SOURCE_BYTES) throw new Error("Source exceeds the 10 MB size limit.");
  const isPdf = input.mimeType === "application/pdf" || input.fileName?.toLowerCase().endsWith(".pdf");
  const isDocx = input.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || input.fileName?.toLowerCase().endsWith(".docx");
  const text = isDocx ? (await mammoth.extractRawText({ buffer: input.buffer })).value : isPdf ? extractPdfText(input.buffer) : input.buffer.toString("utf8");
  const normalized = normalizeSourceText(text);
  if (normalized.length < 20) throw new Error("Unable to extract readable text from this source.");
  return normalized;
}

export function validateSourceType(mimeType: string, fileName = ""): Extract<SchoolSourceType, "upload-pdf" | "upload-text" | "upload-image" | "upload-docx"> {
  if (mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")) return "upload-pdf";
  if (["text/plain", "text/markdown", "text/x-markdown"].includes(mimeType) || /\.(txt|md)$/i.test(fileName)) return "upload-text";
  if (["image/png", "image/jpeg", "image/webp"].includes(mimeType) || /\.(png|jpe?g|webp)$/i.test(fileName)) return "upload-image";
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || fileName.toLowerCase().endsWith(".docx")) return "upload-docx";
  throw new Error("Unsupported source type. Upload a PDF, DOCX, image, TXT, or Markdown file.");
}

export function isSupportedSchoolSourceType(value: string): value is SchoolSourceType { return SCHOOL_SOURCE_TYPES.includes(value as SchoolSourceType); }
