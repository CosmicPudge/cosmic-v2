import { requireSchoolAccess } from "@/services/school/access";
import { getSchoolAssetById } from "@/services/school/assetRepository";
import { getSchoolAssetStore } from "@/services/school/sources/storage";

const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp", "audio/mpeg", "audio/mp4", "audio/wav", "audio/x-wav", "audio/webm", "audio/aac", "audio/ogg", "audio/mpga"]);

export async function GET(request: Request, context: { params: Promise<{ assetId: string }> }) {
  const account = await requireSchoolAccess(request); const asset = await getSchoolAssetById(account.id, (await context.params).assetId);
  if (!asset || !allowedTypes.has(asset.mimeType)) return new Response("Asset not found.", { status: 404 });
  try {
    const bytes = await getSchoolAssetStore().get({ accountId: account.id, key: asset.storageKey });
    if (!bytes) return new Response("Asset not found.", { status: 404 });
    return new Response(Buffer.from(bytes), { headers: { "Content-Type": asset.mimeType, "Content-Length": String(bytes.byteLength), "Cache-Control": "private, no-store", "Content-Disposition": "inline" } });
  } catch { return new Response("Asset is temporarily unavailable.", { status: 503 }); }
}
