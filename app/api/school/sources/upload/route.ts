import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { createSchoolSourceRecord } from "@/services/school/sources/repository";
import { extractSourceText, validateSourceType } from "@/services/school/sources/extractText";
import { processSchoolSourceWithAI } from "@/services/school/sources/processSource";
import { createSchoolSource } from "@/services/school/intelligence";

export async function POST(request: Request) {
  const account = await requireSchoolAccess(request);
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "A PDF, TXT, or Markdown file is required." }, { status: 400 });
  let type: "upload-pdf" | "upload-text";
  try { type = validateSourceType(file.type, file.name); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unsupported source type." }, { status: 415 }); }
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Source exceeds the 10 MB size limit." }, { status: 413 });
  const id = crypto.randomUUID();
  const source = createSchoolSource({ id, accountId: account.id, type, title: (form.get("title") as string | null)?.trim() || file.name.replace(/\.[^.]+$/, ""), originalName: file.name.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 160), importedAt: new Date().toISOString() });
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const extractedText = await extractSourceText({ buffer, mimeType: file.type, fileName: file.name });
    const processed = await processSchoolSourceWithAI(source, extractedText);
    const row = await createSchoolSourceRecord({ id, userId: account.id, title: source.title, sourceType: source.type, originalFileName: source.originalName, mimeType: file.type, fileSize: file.size, category: typeof form.get("category") === "string" ? String(form.get("category")).slice(0, 80) : null, extractedText: processed.extractedText, intelligence: processed.intelligence, processingStatus: processed.processingStatus, processingError: processed.processingError, processedAt: processed.processedAt });
    return NextResponse.json({ source: { id: row.id, title: row.title, sourceType: row.sourceType, processingStatus: row.processingStatus, processingError: row.processingError, processedAt: row.processedAt } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process source.";
    await createSchoolSourceRecord({ id, userId: account.id, title: source.title, sourceType: source.type, originalFileName: source.originalName, mimeType: file.type, fileSize: file.size, category: typeof form.get("category") === "string" ? String(form.get("category")).slice(0, 80) : null, extractedText: null, intelligence: null, processingStatus: "failed", processingError: message });
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
