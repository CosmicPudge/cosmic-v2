import { NextResponse } from "next/server";

import { requireCosmicAccount } from "@/services/auth/server";
import { sendWebPush } from "@/services/push/delivery";
import { getWebPushConfig } from "@/services/push/config";
import { getDatabase } from "@/services/database/client";
import { pushSubscriptions } from "@/services/database/schema";
import { assertSameOrigin } from "@/services/security/origin";
import { allowRateLimit, requestRateKey } from "@/services/security/rateLimit";
import { and, eq } from "drizzle-orm";
import { parsePushSubscription } from "@/services/push/validation";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const account = await requireCosmicAccount(request);
    if (!allowRateLimit(`push:test:${requestRateKey(request)}:${account.id}`, 3, 60_000)) return NextResponse.json({ error: "Please wait before sending another test notification." }, { status: 429 });
    if (!getWebPushConfig()) return NextResponse.json({ error: "Push is not configured in this environment." }, { status: 503 });
    const body = await request.json().catch(() => null) as { subscription?: unknown } | null;
    const subscription = parsePushSubscription(body?.subscription);
    if (!subscription) return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
    const [row] = await getDatabase().select({ endpoint: pushSubscriptions.endpoint, p256dh: pushSubscriptions.p256dh, auth: pushSubscriptions.auth }).from(pushSubscriptions).where(and(eq(pushSubscriptions.userId, account.id), eq(pushSubscriptions.endpoint, subscription.endpoint), eq(pushSubscriptions.status, "active"))).limit(1);
    if (!row) return NextResponse.json({ error: "This device is not registered for push." }, { status: 404 });
    await sendWebPush(row, { signalId: `push-test:${account.id}`, title: "COSMIC SPORTS", body: "Notifications are ready.", route: "/sports", category: "TEST", tag: `push-test:${account.id}` });
    return NextResponse.json({ sent: true });
  } catch (error) {
    if (error instanceof Response) return error;
    const status = typeof error === "object" && error !== null && "statusCode" in error && ((error as { statusCode?: unknown }).statusCode === 404 || (error as { statusCode?: unknown }).statusCode === 410) ? 410 : 503;
    return NextResponse.json({ error: status === 410 ? "This browser subscription has expired." : "Test notification could not be sent." }, { status });
  }
}
