export const MAX_ESTIMATED_MINUTES = 2_000;

export function formatEstimatedMinutes(value: number | null | undefined): string {
  if (!value) return "Not Specified";
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return hours ? `${hours} hr${minutes ? ` ${minutes} min` : ""}` : `${minutes} min`;
}

export function isSafeProviderUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}
