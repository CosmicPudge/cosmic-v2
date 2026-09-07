import { NextResponse } from "next/server";

import { requireCosmicAccount } from "@/services/auth/server";
import { assertSameOrigin } from "@/services/security/origin";
import { allowRateLimit, requestRateKey } from "@/services/security/rateLimit";
import { registerPushSubscription, removePushSubscription } from "@/services/push/store";
import { parsePushSubscription, safeDeviceLabel } from "@/services/push/validation";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const account = await requireCosmicAccount(request);
    if (!allowRateLimit(`push:subscribe:${requestRateKey(request)}:${account.id}`, 10, 60_000)) return NextResponse.json({ error: "Too many subscription attempts." }, { status: 429 });
    const body = await request.json().catch(() => null) as { subscription?: unknown; deviceLabel?: unknown } | null;
    const subscription = parsePushSubscription(body?.subscription);
    if (!subscription) return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
    await registerPushSubscription(account.id, subscription, request.headers.get("user-agent"), safeDeviceLabel(body?.deviceLabel));
    return NextResponse.json({ registered: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Push subscription is unavailable." }, { status: 503 }); }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const account = await requireCosmicAccount(request);
    if (!allowRateLimit(`push:unsubscribe:${requestRateKey(request)}:${account.id}`, 10, 60_000)) return NextResponse.json({ error: "Too many subscription attempts." }, { status: 429 });
    const body = await request.json().catch(() => null) as { subscription?: unknown } | null;
    const subscription = parsePushSubscription(body?.subscription);
    if (!subscription) return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
    return NextResponse.json({ removed: await removePushSubscription(account.id, subscription.endpoint) });
  } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Push subscription could not be removed." }, { status: 503 }); }
}
