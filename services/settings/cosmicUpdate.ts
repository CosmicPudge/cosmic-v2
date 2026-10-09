import "server-only";

import type { CosmicUpdateStatus } from "@/core/contracts/Updates";
import { COSMIC_APP_VERSION } from "@/services/settings/dataTransfer";

function versionParts(value: string) {
  return value.replace(/^v/i, "").split(".").map((part) => Number.parseInt(part, 10)).map((part) => Number.isFinite(part) ? part : 0);
}

export function compareCosmicVersions(left: string, right: string) {
  const a = versionParts(left); const b = versionParts(right);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const delta = (a[index] ?? 0) - (b[index] ?? 0);
    if (delta) return delta;
  }
  return 0;
}

export function readCosmicUpdateStatus(now = new Date()): CosmicUpdateStatus {
  const currentVersion = String(COSMIC_APP_VERSION);
  const configuredLatestVersion = process.env.COSMIC_LATEST_VERSION;
  const latestVersion = typeof configuredLatestVersion === "string" ? configuredLatestVersion.trim() || currentVersion : currentVersion;
  const updateAvailable = compareCosmicVersions(latestVersion, currentVersion) > 0;
  return { currentVersion, latestVersion, updateAvailable, checkedAt: now.toISOString(), state: updateAvailable ? "available" : "up-to-date" };
}
