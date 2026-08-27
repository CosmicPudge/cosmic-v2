import { NextResponse } from "next/server";
import { accountSnapshot } from "@/services/music/spotify";
import { kioskBootId, requireAuthenticatedSession } from "@/services/auth/server";

function musicLog(message: string) { if (process.env.NODE_ENV !== "production") console.info(`[kiosk-music] ${message}`); }

export async function GET(request: Request) {
  const session = await requireAuthenticatedSession(request, { allowDevice: true, bootId: kioskBootId(request) });
  musicLog(`session=${session.sessionType ?? "user"} ownerResolved=${Boolean(session.account.id)}`);
  if (!process.env.DATABASE_URL) return NextResponse.json({ provider: "spotify", connected: false, capabilities: {}, playback: { playing: false, positionMs: 0, updatedAt: "" }, error: "Account music storage is unavailable." }, { headers: { "Cache-Control": "no-store" } });
  const snapshot = await accountSnapshot(session.account.id);
  musicLog(`spotifyConnection=${snapshot.connected || Boolean(snapshot.error && /temporarily|rate limited/i.test(snapshot.error))} playbackStatus=${snapshot.connected ? snapshot.playback.track ? 200 : 204 : "not-requested"}`);
  return NextResponse.json(snapshot, { headers: { "Cache-Control": "no-store" } });
}
