import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { assertSameOrigin } from "@/services/security/origin";
import { getSchoolAsset } from "@/services/school/assetRepository";
import { parseAndNormalizeOpord } from "@/services/school/opord/process";
import { getSchoolSource, updateSchoolSourceRecord } from "@/services/school/sources/repository";
import { extractSourceContent } from "@/services/school/sources/extractText";
import { getSchoolAssetStore } from "@/services/school/sources/storage";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ sourceId: string }> }) {
  assertSameOrigin(request); const account = await requireSchoolAccess(request); const sourceId = (await context.params).sourceId; const source = await getSchoolSource(account.id, sourceId);
  if (!source || source.category !== "afrotc-opord") return NextResponse.json({ error: "OPORD not found." }, { status: 404 });
  const asset = await getSchoolAsset(account.id, sourceId); if (!asset) return NextResponse.json({ error: "The private original OPORD is unavailable for reprocessing." }, { status: 422 });
  try { const bytes = await getSchoolAssetStore().get({ accountId: account.id, key: asset.storageKey }); if (!bytes) throw new Error("The private original OPORD is unavailable for reprocessing."); const extracted = await extractSourceContent({ buffer: Buffer.from(bytes), mimeType: asset.mimeType, fileName: source.originalFileName ?? asset.originalFileName }); const text = extracted.text; const document = parseAndNormalizeOpord({ text, layout: extracted.layout, sourceId, sourceName: source.originalFileName ?? asset.originalFileName }); const updated = await updateSchoolSourceRecord(account.id, sourceId, { extractedText: text, intelligence: document, processingStatus: document.events.length ? "ready" : "needs_review", processingError: null, processedAt: new Date(), processingVersion: source.processingVersion + 1 }); const readBackSource = await getSchoolSource(account.id, sourceId); const readBack = readBackSource?.intelligence && typeof readBackSource.intelligence === "object" ? readBackSource.intelligence as typeof document : null; const readBackEventCount = readBack?.events?.length ?? 0; const readbackVerified = Boolean(readBack && readBackEventCount === document.events.length && readBack.parserVersion === document.parserVersion); if (!updated || !readBack || !readbackVerified) throw new Error("OPORD reprocess readback did not match the newly parsed intelligence."); return NextResponse.json({ sourceId, parserVersion: readBack.parserVersion, eventCount: readBackEventCount, sourcePages: readBack.events.map((event) => event.diagnostics?.sourcePage ?? null), processingStatus: readBackSource.processingStatus, readbackVerified: true, document: readBack, message: readBackEventCount ? "OPORD reprocessed and parsed." : "Document reprocessed, but no OPORD events were found." }); } catch (error) { return NextResponse.json({ error: error instanceof Error && /Unable to extract readable text|unavailable|exceeds|readback/.test(error.message) ? error.message : "OPORD could not be reprocessed." }, { status: 422 }); }
}
