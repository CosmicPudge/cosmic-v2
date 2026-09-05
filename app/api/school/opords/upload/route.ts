import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { assertSameOrigin } from "@/services/security/origin";
import { createSchoolAsset } from "@/services/school/assetRepository";
import { createSchoolSourceRecord } from "@/services/school/sources/repository";
import { extractSourceText, MAX_SOURCE_BYTES, validateSourceType } from "@/services/school/sources/extractText";
import { getSchoolAssetStore } from "@/services/school/sources/storage";
import { parseAfrotcOpord } from "@/services/school/opord/parser";

const MIME: Record<string, string> = { "upload-pdf": "application/pdf", "upload-docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "upload-text": "text/plain" };
const MAX_TITLE = 180;
function safeFileName(name: string) { return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180) || "opord"; }

export async function POST(request: Request) {
  assertSameOrigin(request);
  const account = await requireSchoolAccess(request);
  const form = await request.formData(); const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a PDF, DOCX, or TXT file." }, { status: 400 });
  if (file.size > MAX_SOURCE_BYTES) return NextResponse.json({ error: "OPORD exceeds the 10 MB size limit." }, { status: 413 });
  let sourceType: "upload-pdf" | "upload-docx" | "upload-text";
  try { const candidate = validateSourceType(file.type, file.name); if (!(candidate in MIME)) throw new Error("Upload a PDF, DOCX, or TXT file."); sourceType = candidate as typeof sourceType; } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unsupported OPORD file." }, { status: 400 }); }
  const bytes = Buffer.from(await file.arrayBuffer()); const fileName = safeFileName(file.name); const sourceId = crypto.randomUUID();
  try {
    const text = await extractSourceText({ buffer: bytes, mimeType: MIME[sourceType], fileName });
    const document = parseAfrotcOpord({ text, sourceId, sourceName: file.name.slice(0, MAX_TITLE) });
    const source = await createSchoolSourceRecord({ id: sourceId, userId: account.id, title: document.title.status === "explicit" ? document.title.value : file.name.slice(0, MAX_TITLE), sourceType, category: "afrotc-opord", sourcePurpose: "afrotc", originalFileName: file.name.slice(0, MAX_TITLE), mimeType: MIME[sourceType], fileSize: file.size, extractedText: text, intelligence: document, processingStatus: document.events.length ? "ready" : "needs_review", processedAt: new Date() });
    try { const stored = await getSchoolAssetStore().put({ accountId: account.id, sourceId, bytes, mimeType: MIME[sourceType], safeFileName: fileName }); await createSchoolAsset({ id: crypto.randomUUID(), userId: account.id, sourceId, originalFileName: file.name.slice(0, MAX_TITLE), safeFileName: fileName, mimeType: MIME[sourceType], size: file.size, storageProvider: stored.provider, storageKey: stored.key }); } catch (error) { await import("@/services/school/sources/repository").then(({ updateSchoolSourceRecord }) => updateSchoolSourceRecord(account.id, sourceId, { processingStatus: "ready_degraded", processingError: "OPORD text was processed, but the private original file could not be retained." })); }
    return NextResponse.json({ source: { id: source.id, title: source.title, processingStatus: source.processingStatus }, document }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "OPORD could not be processed." }, { status: 422 }); }
}
