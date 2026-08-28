import { NextResponse } from "next/server";
import { accountSnapshotWithDiagnostics } from "@/services/music/spotify";
import { musicPlaybackDiagnostics } from "@/services/music/musicDiagnostics";
import { kioskBootId, requireAuthenticatedSession } from "@/services/auth/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function musicLog(message: string) { if (process.env.NODE_ENV !== "production") console.info(`[kiosk-music] ${message}`); }
export async function GET(request: Request) {
  const session = await requireAuthenticatedSession(request, { allowDevice: true, bootId: kioskBootId(request) });
  musicLog(`session=${session.sessionType ?? "user"} ownerResolved=${Boolean(session.account.id)}`);
  if (!process.env.DATABASE_URL) return NextResponse.json({ provider: "spotify", connected: false, capabilities: {}, playback: { playing: false, positionMs: 0, updatedAt: "" }, error: "Account music storage is unavailable." }, { headers: { "Cache-Control": "no-store" } });
  const result = await accountSnapshotWithDiagnostics(session.account.id);
  const snapshot = result.snapshot;
  musicLog(`spotifyConnection=${snapshot.connected || Boolean(snapshot.error && /temporarily|rate limited/i.test(snapshot.error))} playbackStatus=${snapshot.connected ? snapshot.playback.track ? 200 : 204 : "not-requested"}`);
  const trackId = snapshot.playback.track?.id;
  if (process.env.NODE_ENV !== "production") musicLog(`returnedTrackPresent=${Boolean(trackId)} trackIdSuffix=${trackId ? trackId.slice(-4) : "none"}`);
  const providerDiagnostics = musicPlaybackDiagnostics(snapshot.playback);
  const responsePayload = { ...snapshot, diagnostics: { rawProvider: result.rawProvider ?? null, provider: providerDiagnostics, response: musicPlaybackDiagnostics(JSON.parse(JSON.stringify(snapshot.playback)) as typeof snapshot.playback) } };
  return NextResponse.json(responsePayload, { headers: { "Cache-Control": "private, no-store, no-cache, must-revalidate, max-age=0" } });
}
