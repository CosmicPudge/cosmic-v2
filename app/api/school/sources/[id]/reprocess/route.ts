import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { getSchoolSource, updateSchoolSourceRecord } from "@/services/school/sources/repository";
import { processSchoolSourceWithAI } from "@/services/school/sources/processSource";
import type { SchoolSource } from "@/core/contracts/SchoolIntelligence";
import { getSchoolAsset } from "@/services/school/assetRepository";
import { getSchoolAssetStore } from "@/services/school/sources/storage";
import { OpenAISchoolMultimodalExtractor } from "@/services/school/sources/multimodal";
import { upsertRawSchoolFindings } from "@/services/school/findingRepository";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const account = await requireSchoolAccess(request);
  const id = (await context.params).id;
  const row = await getSchoolSource(account.id, id);
  if (!row) return NextResponse.json({ error: "Source not found." }, { status: 404 });
  try {
    if (row.sourceType === "upload-image") {
      const asset = await getSchoolAsset(account.id, id); if (!asset) return NextResponse.json({ error: "The retained image asset is unavailable." }, { status: 422 });
      const bytes = await getSchoolAssetStore().get({ accountId: account.id, key: asset.storageKey }); if (!bytes) return NextResponse.json({ error: "The retained image asset is unavailable." }, { status: 422 });
      const analyzed = await new OpenAISchoolMultimodalExtractor().analyze({ bytes, mimeType: asset.mimeType as "image/png" | "image/jpeg" | "image/webp" });
      await upsertRawSchoolFindings(account.id, id, analyzed.findings, row.courseId);
      const updatedImage = await updateSchoolSourceRecord(account.id, id, { extractedText: analyzed.transcription ?? null, processingStatus: "needs_review", processingError: analyzed.observations.length ? analyzed.observations.join(" ").slice(0, 1000) : null, processedAt: new Date(), processingVersion: row.processingVersion + 1 });
      return NextResponse.json({ source: updatedImage });
    }
    if (!row.extractedText) return NextResponse.json({ error: "This source has no retained text to reprocess." }, { status: 422 });
    const source: SchoolSource = { id: row.id, accountId: row.userId, type: row.sourceType as SchoolSource["type"], title: row.title, ...(row.originalFileName ? { originalName: row.originalFileName } : {}), importedAt: row.createdAt.toISOString(), status: "processing", version: row.processingVersion };
    const processed = await processSchoolSourceWithAI(source, row.extractedText);
    const updated = await updateSchoolSourceRecord(account.id, id, { intelligence: processed.intelligence, processingStatus: processed.processingStatus, processingError: processed.processingError, processedAt: processed.processedAt, processingVersion: row.processingVersion + 1 });
    return NextResponse.json({ source: updated });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Source processing failed." }, { status: 422 }); }
}
