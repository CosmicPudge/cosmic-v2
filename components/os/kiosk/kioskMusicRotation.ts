export const KIOSK_MUSIC_PLAYBACK_STALE_MS = 75_000;

export function shouldPauseKioskForMusic({ standalone, scene, playing, lastSeenAt, now = Date.now() }: { standalone: boolean; scene: string | undefined; playing: boolean; lastSeenAt: number | undefined; now?: number }) {
  if (!standalone || scene !== "music" || !playing || lastSeenAt === undefined) return false;
  return now - lastSeenAt <= KIOSK_MUSIC_PLAYBACK_STALE_MS;
}
