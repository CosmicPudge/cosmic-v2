import { NextResponse } from "next/server";
import { accountSnapshot, snapshot } from "@/services/music/spotify";
import { getCurrentCosmicAccount } from "@/services/auth/server";
export async function GET(request: Request) { const account = await getCurrentCosmicAccount(request); if (account && !process.env.DATABASE_URL) return NextResponse.json({ provider: "spotify", connected: false, capabilities: {}, playback: { playing: false, positionMs: 0, updatedAt: "" }, error: "Account music storage is unavailable." }); return NextResponse.json(account ? await accountSnapshot(account.id) : await snapshot()); }
