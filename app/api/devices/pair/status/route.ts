import { getPairingStatus, consumeApprovedPairing } from "@/services/devices/pairing";
import { deviceCookie, sessionCookie } from "@/services/auth/localStore";
import { allowRateLimit, requestRateKey } from "@/services/security/rateLimit";

export async function POST(request: Request) {
  if (!allowRateLimit(`pair:poll:${requestRateKey(request)}`, 30, 60_000)) return Response.json({ status: "pending" }, { status: 429, headers: { "Retry-After": "4", "Cache-Control": "no-store" } });
  const body = await request.json().catch(() => null) as { deviceCode?: unknown } | null;
  if (typeof body?.deviceCode !== "string" || body.deviceCode.length < 32) return Response.json({ status: "expired" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  try {
    const status = await getPairingStatus(body.deviceCode);
    if (status.status !== "approved") return Response.json(status, { headers: { "Cache-Control": "no-store" } });
    const session = await consumeApprovedPairing(body.deviceCode);
    if (!session) return Response.json({ status: "expired" }, { headers: { "Cache-Control": "no-store" } });
    const headers = new Headers({ "Cache-Control": "no-store" }); headers.append("Set-Cookie", sessionCookie(session.token, session.expiresAt)); headers.append("Set-Cookie", deviceCookie(session.deviceId));
    return Response.json({ status: "approved" }, { headers });
  } catch { return Response.json({ error: "Device pairing is unavailable." }, { status: 503 }); }
}
