import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { createSchoolSourceRecord } from "@/services/school/sources/repository";
import { extractSourceText, validateSourceType } from "@/services/school/sources/extractText";
import { processSchoolSourceWithAI } from "@/services/school/sources/processSource";
import { createSchoolSource } from "@/services/school/intelligence";
import { OpenAISchoolMultimodalExtractor } from "@/services/school/sources/multimodal";
import { getSchoolAssetStore } from "@/services/school/sources/storage";
import { createSchoolAsset } from "@/services/school/assetRepository";
import { updateSchoolSourceRecord } from "@/services/school/sources/repository";
import { upsertRawSchoolFindings } from "@/services/school/findingRepository";
import { AIProviderError } from "@/services/ai/provider";
import { safeDatabaseFailure } from "@/services/school/sources/dbDiagnostics";
import { classifySchoolSourcePurpose } from "@/services/school/coursePlan";

function logSourceCreateFailure(error: unknown, sourceType: string, processingStatus: string) {
  if (process.env.NODE_ENV === "production") return;
  const failure = safeDatabaseFailure(error);
  console.info(`[school-source-create] stage=create_source dbCode=${failure.dbCode}${failure.constraint ? ` constraint=${failure.constraint}` : ""}${failure.column ? ` column=${failure.column}` : ""} sourceType=${sourceType} processingStatus=${processingStatus}`);
}

function imageFailureReason(error: unknown) {
  if (error instanceof AIProviderError) {
    if (error.code === "provider_not_configured") return "PROVIDER_NOT_CONFIGURED";
    if (error.status === 401) return "PROVIDER_UNAUTHORIZED";
    if (error.status === 403) return "PROVIDER_FORBIDDEN";
    if (error.status === 429 && error.metadata?.code === "credit_balance_exhausted") return "PROVIDER_QUOTA_EXHAUSTED";
    if (error.status === 429) return "PROVIDER_RATE_LIMITED";
    if (error.status && error.status >= 500) return "PROVIDER_SERVER_ERROR";
    return "VISION_UNAVAILABLE";
  }
  return "VISION_UNAVAILABLE";
}

function safeImageError(reason: string) {
  return reason === "PROVIDER_NOT_CONFIGURED" ? "Image analysis unavailable — AI provider is not configured." : reason === "PROVIDER_QUOTA_EXHAUSTED" ? "Image analysis unavailable — AI provider quota exhausted." : reason === "PROVIDER_RATE_LIMITED" ? "Image analysis unavailable — AI provider rate limited." : "Image analysis unavailable; the image was retained for retry.";
}

export async function POST(request: Request) {
  const account = await requireSchoolAccess(request);
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "A PDF, DOCX, image, TXT, or Markdown file is required." }, { status: 400 });
  let type: "upload-pdf" | "upload-text" | "upload-image" | "upload-docx";
  try { type = validateSourceType(file.type, file.name); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unsupported source type." }, { status: 415 }); }
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Source exceeds the 10 MB size limit." }, { status: 413 });
  const id = crypto.randomUUID();
  const source = createSchoolSource({ id, accountId: account.id, type, title: (form.get("title") as string | null)?.trim() || file.name.replace(/\.[^.]+$/, ""), originalName: file.name.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 160), importedAt: new Date().toISOString() });
  let stage = "read_bytes";
  let sourceRow: Awaited<ReturnType<typeof createSchoolSourceRecord>> | null = null;
  let assetRetained = false;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    if (type === "upload-image") {
      stage = "create_source";
      let row: Awaited<ReturnType<typeof createSchoolSourceRecord>>;
      try { row = await createSchoolSourceRecord({ id, userId: account.id, title: source.title, sourceType: type, originalFileName: source.originalName, mimeType: file.type, fileSize: file.size, category: typeof form.get("category") === "string" ? String(form.get("category")).slice(0, 80) : null, sourcePurpose: classifySchoolSourcePurpose(source.title), extractedText: null, intelligence: null, processingStatus: "processing" }); } catch (error) { logSourceCreateFailure(error, type, "processing"); throw error; }
      sourceRow = row;
      stage = "retain_asset";
      const stored = await getSchoolAssetStore().put({ accountId: account.id, sourceId: id, bytes: buffer, mimeType: file.type, safeFileName: source.originalName ?? "image" });
      assetRetained = true;
      stage = "persist_asset_metadata";
      await createSchoolAsset({ id: crypto.randomUUID(), userId: account.id, sourceId: id, originalFileName: file.name.slice(0, 160), safeFileName: source.originalName ?? "image", mimeType: file.type, size: file.size, storageProvider: stored.provider, storageKey: stored.key });
      try {
        stage = "invoke_vision";
        const analyzed = await new OpenAISchoolMultimodalExtractor().analyze({ bytes: buffer, mimeType: file.type as "image/png" | "image/jpeg" | "image/webp" });
        await upsertRawSchoolFindings(account.id, id, analyzed.findings, row.courseId);
        const updated = await updateSchoolSourceRecord(account.id, id, { extractedText: analyzed.transcription ?? null, processingStatus: "needs_review", processingError: analyzed.observations.length ? analyzed.observations.join(" ").slice(0, 1000) : null });
        return NextResponse.json({ source: updated ?? row }, { status: 201 });
      } catch (error) {
        const reason = imageFailureReason(error);
        if (process.env.NODE_ENV !== "production") console.info(`[school-image-upload] status=degraded reason=${reason} source=${id} assetRetained=true`);
        const updated = await updateSchoolSourceRecord(account.id, id, { processingStatus: "ready_degraded", processingError: safeImageError(reason) });
        return NextResponse.json({ source: updated ?? row }, { status: 201 });
      }
    }
    const extractedText = await extractSourceText({ buffer, mimeType: file.type, fileName: file.name });
    const processed = await processSchoolSourceWithAI(source, extractedText);
    let row: Awaited<ReturnType<typeof createSchoolSourceRecord>>;
    try { row = await createSchoolSourceRecord({ id, userId: account.id, title: source.title, sourceType: source.type, originalFileName: source.originalName, mimeType: file.type, fileSize: file.size, category: typeof form.get("category") === "string" ? String(form.get("category")).slice(0, 80) : null, sourcePurpose: classifySchoolSourcePurpose(source.title, extractedText), extractedText: processed.extractedText, intelligence: processed.intelligence, processingStatus: processed.processingStatus, processingError: processed.processingError, processedAt: processed.processedAt }); } catch (error) { logSourceCreateFailure(error, source.type, processed.processingStatus); throw error; }
    return NextResponse.json({ source: { id: row.id, title: row.title, sourceType: row.sourceType, processingStatus: row.processingStatus, processingError: row.processingError, processedAt: row.processedAt } }, { status: 201 });
  } catch {
    const isImageRetentionFailure = source.type === "upload-image" && sourceRow !== null;
    const reason = isImageRetentionFailure ? "IMAGE_RETENTION_FAILED" : source.type === "upload-docx" ? "DOCX_EXTRACTION_UNAVAILABLE" : "SOURCE_UPLOAD_FAILED";
    const message = isImageRetentionFailure ? "Image could not be retained for analysis." : source.type === "upload-docx" ? "DOCX extraction is unavailable; the source could not be analyzed." : "School source upload failed.";
    if (process.env.NODE_ENV !== "production") console.info(`[school-image-upload] status=422 reason=${reason} stage=${stage} source=${id} processingStatus=${sourceRow?.processingStatus ?? "not_created"} assetRetained=${assetRetained}`);
    try { if (sourceRow) await updateSchoolSourceRecord(account.id, id, { processingStatus: "failed", processingError: message }); else await createSchoolSourceRecord({ id, userId: account.id, title: source.title, sourceType: source.type, originalFileName: source.originalName, mimeType: file.type, fileSize: file.size, category: typeof form.get("category") === "string" ? String(form.get("category")).slice(0, 80) : null, extractedText: null, intelligence: null, processingStatus: "failed", processingError: message }); } catch { /* preserve the safe API error even when persistence is unavailable */ }
    return NextResponse.json({ error: message, reason }, { status: 422 });
  }
}
