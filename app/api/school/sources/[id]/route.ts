import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { deleteSchoolSourceRecord, getSchoolSource } from "@/services/school/sources/repository";
import { applySourceCourseToPendingFindings, listSchoolFindings, reconcileSchoolConflicts, upsertSchoolFindings } from "@/services/school/findingRepository";
import { assertSameOrigin } from "@/services/security/origin";
import { isValidSchoolCourseId } from "@/services/school/courseOverride";
import { deleteSchoolAsset, getSchoolAsset } from "@/services/school/assetRepository";
import { getSchoolAssetStore } from "@/services/school/sources/storage";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const account = await requireSchoolAccess(request);
  const row = await getSchoolSource(account.id, (await context.params).id);
  if (!row) return NextResponse.json({ error: "Source not found." }, { status: 404 });
  if (row.intelligence) await upsertSchoolFindings(account.id, row.id, row.intelligence as Parameters<typeof upsertSchoolFindings>[2], row.courseId);
  await reconcileSchoolConflicts(account.id, row.id);
  return NextResponse.json({ source: row, findings: await listSchoolFindings(account.id, row.id) }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const account = await requireSchoolAccess(request);
  const id = (await context.params).id; const asset = await getSchoolAsset(account.id, id);
  if (asset) { try { await getSchoolAssetStore().delete({ accountId: account.id, key: asset.storageKey }); } catch { return NextResponse.json({ error: "Source storage is temporarily unavailable; nothing was deleted." }, { status: 503 }); } }
  const deleted = await deleteSchoolSourceRecord(account.id, id);
  if (deleted && asset) await deleteSchoolAsset(account.id, id);
  return deleted ? NextResponse.json({ deleted: true }) : NextResponse.json({ error: "Source not found." }, { status: 404 });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  assertSameOrigin(request); const account = await requireSchoolAccess(request); const body = await request.json().catch(() => ({})) as { courseId?: unknown };
  if (body.courseId !== null && !isValidSchoolCourseId(body.courseId)) return NextResponse.json({ error: "Invalid course." }, { status: 400 });
  const { updateSchoolSourceRecord } = await import("@/services/school/sources/repository"); const id = (await context.params).id;
  const source = await getSchoolSource(account.id, id); if (!source) return NextResponse.json({ error: "Source not found." }, { status: 404 });
  const courseId = body.courseId || null; const updated = await updateSchoolSourceRecord(account.id, id, { courseId }); await applySourceCourseToPendingFindings(account.id, id, courseId); return NextResponse.json({ source: updated });
}
