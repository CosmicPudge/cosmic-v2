import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { getSchoolSource, updateSchoolSourceRecord } from "@/services/school/sources/repository";
import { processSchoolSourceWithAI } from "@/services/school/sources/processSource";
import type { SchoolSource } from "@/core/contracts/SchoolIntelligence";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const account = await requireSchoolAccess(request);
  const id = (await context.params).id;
  const row = await getSchoolSource(account.id, id);
  if (!row) return NextResponse.json({ error: "Source not found." }, { status: 404 });
  if (!row.extractedText) return NextResponse.json({ error: "This source has no retained text to reprocess." }, { status: 422 });
  try {
    const source: SchoolSource = { id: row.id, accountId: row.userId, type: row.sourceType as SchoolSource["type"], title: row.title, ...(row.originalFileName ? { originalName: row.originalFileName } : {}), importedAt: row.createdAt.toISOString(), status: "processing", version: row.processingVersion };
    const processed = await processSchoolSourceWithAI(source, row.extractedText);
    const updated = await updateSchoolSourceRecord(account.id, id, { intelligence: processed.intelligence, processingStatus: processed.processingStatus, processingError: processed.processingError, processedAt: processed.processedAt, processingVersion: row.processingVersion + 1 });
    return NextResponse.json({ source: updated });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Source processing failed." }, { status: 422 }); }
}
