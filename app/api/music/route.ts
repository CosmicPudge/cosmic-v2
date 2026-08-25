import { NextResponse } from "next/server";
import { accountSnapshot } from "@/services/music/spotify";
import { requireCosmicAccount } from "@/services/auth/server";
export async function GET(request: Request) { const account = await requireCosmicAccount(request); if (!process.env.DATABASE_URL) return NextResponse.json({ provider: "spotify", connected: false, capabilities: {}, playback: { playing: false, positionMs: 0, updatedAt: "" }, error: "Account music storage is unavailable." }); return NextResponse.json(await accountSnapshot(account.id)); }
