import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { deleteUnapprovedSchoolTranscript, getSchoolAudioTranscript } from "@/services/school/audioRepository";
import { getSchoolAssetById } from "@/services/school/assetRepository";
import { getSchoolAssetStore } from "@/services/school/sources/storage";
import { assertSameOrigin } from "@/services/security/origin";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const account = await requireSchoolAccess(request);
    const id = (await context.params).id;
    const transcript = await getSchoolAudioTranscript(account.id, id);
    const asset = transcript?.assetId ? await getSchoolAssetById(account.id, transcript.assetId) : null;
    const result = await deleteUnapprovedSchoolTranscript(account.id, id, asset ? () => getSchoolAssetStore().delete({ accountId: account.id, key: asset.storageKey }) : undefined);
    if (result.status === "not_found") return NextResponse.json({ error: "Voice note not found." }, { status: 404 });
    if (result.status === "approved") return NextResponse.json({ error: "Approved notes must be deleted as notes." }, { status: 409 });
    if (result.status === "blocked") return NextResponse.json({ error: "This transcript is referenced by other School data and cannot be deleted here.", dependencies: result.dependencies }, { status: 409 });
    return NextResponse.json({ deleted: true, sourceId: result.sourceId });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Transcript could not be deleted." }, { status: 503 });
  }
}
