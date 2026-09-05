import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { assertSameOrigin } from "@/services/security/origin";
import { createSchoolAsset, getSchoolAsset } from "@/services/school/assetRepository";
import { createSchoolSourceRecord, listSchoolSources, updateSchoolSourceRecord } from "@/services/school/sources/repository";
import { extractSourceContent, MAX_SOURCE_BYTES, validateSourceType } from "@/services/school/sources/extractText";
import { getSchoolAssetStore } from "@/services/school/sources/storage";
import { parseAndNormalizeOpord } from "@/services/school/opord/process";

export const runtime = "nodejs";

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
  const bytes = Buffer.from(await file.arrayBuffer()); const fileName = safeFileName(file.name); const allExisting = await listSchoolSources(account.id); const existing = allExisting.find((row) => row.category === "afrotc-opord" && row.originalFileName === file.name); const sourceId = existing?.id ?? crypto.randomUUID();
  try {
    const extracted = await extractSourceContent({ buffer: bytes, mimeType: MIME[sourceType], fileName });
    const text = extracted.text;
    const document = parseAndNormalizeOpord({ text, layout: extracted.layout, sourceId, sourceName: file.name.slice(0, MAX_TITLE) });
    const sameWeek = !existing && document.weekNumber ? allExisting.filter((row) => { const old = row.intelligence && typeof row.intelligence === "object" ? row.intelligence as { documentKind?: string; weekNumber?: number; isSuperseded?: boolean } : null; return row.category === "afrotc-opord" && old?.documentKind === "afrotc_opord" && old.weekNumber === document.weekNumber && !old.isSuperseded; }) : [];
    const revisedDocument = sameWeek[0] ? { ...document, revisionOfSourceId: sameWeek[0].id } : document;
    const source = existing ? await updateSchoolSourceRecord(account.id, sourceId, { title: revisedDocument.title.status === "explicit" ? revisedDocument.title.value : file.name.slice(0, MAX_TITLE), sourceType, sourcePurpose: "afrotc", mimeType: MIME[sourceType], fileSize: file.size, extractedText: text, intelligence: revisedDocument, processingStatus: revisedDocument.events.length ? "ready" : "needs_review", processingError: null, processedAt: new Date() }) : await createSchoolSourceRecord({ id: sourceId, userId: account.id, title: revisedDocument.title.status === "explicit" ? revisedDocument.title.value : file.name.slice(0, MAX_TITLE), sourceType, category: "afrotc-opord", sourcePurpose: "afrotc", originalFileName: file.name.slice(0, MAX_TITLE), mimeType: MIME[sourceType], fileSize: file.size, extractedText: text, intelligence: revisedDocument, processingStatus: revisedDocument.events.length ? "ready" : "needs_review", processedAt: new Date() });
    if (!source) throw new Error("OPORD source could not be saved.");
    for (const old of sameWeek) { const oldDocument = old.intelligence && typeof old.intelligence === "object" ? old.intelligence as Record<string, unknown> : null; if (oldDocument) await updateSchoolSourceRecord(account.id, old.id, { intelligence: { ...oldDocument, isSuperseded: true } }); }
    try { if (!existing || !(await getSchoolAsset(account.id, sourceId))) { const stored = await getSchoolAssetStore().put({ accountId: account.id, sourceId, bytes, mimeType: MIME[sourceType], safeFileName: fileName }); await createSchoolAsset({ id: crypto.randomUUID(), userId: account.id, sourceId, originalFileName: file.name.slice(0, MAX_TITLE), safeFileName: fileName, mimeType: MIME[sourceType], size: file.size, storageProvider: stored.provider, storageKey: stored.key }); } } catch { await updateSchoolSourceRecord(account.id, sourceId, { processingStatus: "ready_degraded", processingError: "OPORD text was processed, but the private original file could not be retained." }); }
    return NextResponse.json({ source: { id: source.id, title: source.title, processingStatus: source.processingStatus }, document, message: document.events.length ? (existing ? "OPORD updated and parsed." : "OPORD uploaded and parsed.") : "Document uploaded, but no OPORD events were found." }, { status: existing ? 200 : 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error && /exceeds the (?:10 MB|50 page|300000 character) limit/.test(error.message) ? error.message : "OPORD could not be processed." }, { status: 422 }); }
}
