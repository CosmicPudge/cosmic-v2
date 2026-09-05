export interface AmbientProgressSnapshot {
  positionMs: number;
  durationMs?: number;
  playing: boolean;
  updatedAt?: string;
}

export function deriveAmbientProgress(snapshot: AmbientProgressSnapshot, nowMs = Date.now(), maxStaleMs = 45_000) {
  const duration = typeof snapshot.durationMs === "number" && snapshot.durationMs > 0 ? snapshot.durationMs : undefined;
  const position = Math.max(0, snapshot.positionMs || 0);
  const anchoredAt = snapshot.updatedAt ? Date.parse(snapshot.updatedAt) : Number.NaN;
  const age = Number.isFinite(anchoredAt) ? Math.max(0, nowMs - anchoredAt) : 0;
  const stale = snapshot.playing && (!Number.isFinite(anchoredAt) || age > maxStaleMs);
  const interpolated = snapshot.playing && !stale ? position + age : position;
  return {
    progressMs: duration ? Math.min(duration, Math.max(0, interpolated)) : Math.max(0, interpolated),
    durationMs: duration,
    stale,
  };
}

export function formatAmbientProgress(valueMs: number) {
  const totalSeconds = Math.max(0, Math.floor(valueMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}` : `${minutes}:${String(seconds).padStart(2, "0")}`;
}
