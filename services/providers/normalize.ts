export function normalizeProviderId(value?: string | null) {
  const normalized = value?.trim().toLowerCase().replace(/[\s_-]+/g, "");
  if (normalized === "spotify" || normalized === "spotifymusic" || normalized === "music") return "spotify";
  if (normalized === "gmail" || normalized === "googlemail") return "gmail";
  if (normalized === "outlook" || normalized === "microsoft" || normalized === "microsoft365") return "outlook";
  if (normalized === "calendar" || normalized === "caldav") return "calendar";
  return normalized;
}
