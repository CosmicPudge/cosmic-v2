import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { createSchoolSourceRecord, listSchoolSources } from "@/services/school/sources/repository";
import { processSchoolSourceWithAI } from "@/services/school/sources/processSource";
import { createSchoolSource } from "@/services/school/intelligence";
import { SCHOOL_AI_ENABLED } from "@/services/school/capabilities";

function safeSource(row: Awaited<ReturnType<typeof listSchoolSources>>[number]) {
  const intelligence = row.intelligence as { facts?: unknown[]; events?: unknown[]; actionItems?: unknown[]; conflicts?: unknown[] } | null;
  return { id: row.id, title: row.title, sourceType: row.sourceType, category: row.category, originalFileName: row.originalFileName, mimeType: row.mimeType, fileSize: row.fileSize, sourceDate: row.sourceDate, notes: row.notes, processingStatus: row.processingStatus, processingVersion: row.processingVersion, processingError: row.processingError, processedAt: row.processedAt, createdAt: row.createdAt, updatedAt: row.updatedAt, extractedFactsCount: intelligence?.facts?.length ?? 0, eventsCount: intelligence?.events?.length ?? 0, actionItemsCount: intelligence?.actionItems?.length ?? 0, conflictsCount: intelligence?.conflicts?.length ?? 0 };
}

export async function GET(request: Request) {
  const account = await requireSchoolAccess(request);
  const rows = await listSchoolSources(account.id);
  return NextResponse.json({ sources: rows.map(safeSource) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const account = await requireSchoolAccess(request);
  if (!SCHOOL_AI_ENABLED) return NextResponse.json({ error: "school_ai_unavailable" }, { status: 503 });
  const body = await request.json() as { title?: unknown; text?: unknown; category?: unknown; notes?: unknown; sourceDate?: unknown };
  if (typeof body.title !== "string" || !body.title.trim() || typeof body.text !== "string") return NextResponse.json({ error: "Title and pasted text are required." }, { status: 400 });
  const id = crypto.randomUUID();
  const source = createSchoolSource({ id, accountId: account.id, type: "manual", title: body.title.trim(), importedAt: new Date().toISOString(), ...(typeof body.sourceDate === "string" ? { sourceDate: body.sourceDate } : {}) });
  try {
    const processed = await processSchoolSourceWithAI(source, body.text.slice(0, 500_000));
    const row = await createSchoolSourceRecord({ id, userId: account.id, title: source.title, sourceType: source.type, category: typeof body.category === "string" ? body.category.slice(0, 80) : null, notes: typeof body.notes === "string" ? body.notes.slice(0, 500) : null, mimeType: "text/plain", fileSize: Buffer.byteLength(body.text, "utf8"), extractedText: processed.extractedText, intelligence: processed.intelligence, processingStatus: processed.processingStatus, processingError: processed.processingError, processedAt: processed.processedAt });
    return NextResponse.json({ source: safeSource(row) }, { status: 201 });
  } catch (error) {
    const row = await createSchoolSourceRecord({ id, userId: account.id, title: source.title, sourceType: source.type, category: typeof body.category === "string" ? body.category.slice(0, 80) : null, notes: typeof body.notes === "string" ? body.notes.slice(0, 500) : null, mimeType: "text/plain", fileSize: Buffer.byteLength(body.text, "utf8"), extractedText: body.text.slice(0, 200_000), intelligence: null, processingStatus: "failed", processingError: error instanceof Error ? error.message : "Source processing failed." });
    return NextResponse.json({ source: safeSource(row), error: row.processingError }, { status: 422 });
  }
}
