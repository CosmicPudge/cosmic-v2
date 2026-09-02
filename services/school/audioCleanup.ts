import "server-only";
import { deleteSchoolAssetById, getSchoolAssetById } from "./assetRepository";
import { getSchoolAssetStore } from "./sources/storage";
import { getSchoolAudioTranscript, updateSchoolAudioTranscript } from "./audioRepository";

export async function cleanupSchoolAudioAsset(accountId: string, transcriptId: string) {
  const job = await getSchoolAudioTranscript(accountId, transcriptId);
  if (!job || !job.assetId || job.audioCleanupStatus === "deleted") return { status: "deleted" as const };
  const asset = await getSchoolAssetById(accountId, job.assetId);
  if (!asset) {
    await updateSchoolAudioTranscript(accountId, transcriptId, { assetId: null, audioCleanupStatus: "deleted", audioDeletedAt: new Date() });
    return { status: "deleted" as const };
  }
  await updateSchoolAudioTranscript(accountId, transcriptId, { audioCleanupStatus: "deletion_pending" });
  try {
    await getSchoolAssetStore().delete({ accountId, key: asset.storageKey });
    await deleteSchoolAssetById(accountId, asset.id);
    await updateSchoolAudioTranscript(accountId, transcriptId, { assetId: null, audioCleanupStatus: "deleted", audioDeletedAt: new Date() });
    return { status: "deleted" as const };
  } catch {
    return { status: "deletion_pending" as const };
  }
}
