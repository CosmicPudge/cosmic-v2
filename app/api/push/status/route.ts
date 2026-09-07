import { NextResponse } from "next/server";

import { requireCosmicAccount } from "@/services/auth/server";
import { getWebPushConfig } from "@/services/push/config";
import { getPushStatus } from "@/services/push/store";
import { parsePushSubscription } from "@/services/push/validation";

export async function POST(request: Request) {
  try {
    const account = await requireCosmicAccount(request);
    const config = getWebPushConfig();
    if (!config) return NextResponse.json({ configured: false, publicKey: null, registered: false }, { headers: { "Cache-Control": "no-store" } });
    const body = await request.json().catch(() => null) as { subscription?: unknown } | null;
    const subscription = parsePushSubscription(body?.subscription);
    const status = await getPushStatus(account.id, subscription?.endpoint);
    return NextResponse.json({ configured: true, publicKey: config.publicKey, ...status }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Push status is unavailable." }, { status: 503 }); }
}
