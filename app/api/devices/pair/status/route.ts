import { getPairingStatus, consumeApprovedPairing } from "@/services/devices/pairing";
import { allowRateLimit, requestRateKey } from "@/services/security/rateLimit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!allowRateLimit(`pair:poll:${requestRateKey(request)}`, 30, 60_000)) return Response.json({ status: "pending" }, { status: 429, headers: { "Retry-After": "4", "Cache-Control": "no-store" } });
  const body = await request.json().catch(() => null) as { deviceCode?: unknown } | null;
  if (typeof body?.deviceCode !== "string" || body.deviceCode.length < 32) return Response.json({ status: "expired" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  try {
    const status = await getPairingStatus(body.deviceCode);
    if (status.status !== "approved") { const response = Response.json(status, { headers: { "Cache-Control": "no-store" } }); if (process.env.NODE_ENV !== "production") console.info(`[pair] HTTP POST /api/devices/pair/status status=${response.status} state=${status.status}`); return response; }
    const session = await consumeApprovedPairing(body.deviceCode);
    if (!session) { const response = Response.json({ status: "expired" }, { headers: { "Cache-Control": "no-store" } }); if (process.env.NODE_ENV !== "production") console.info(`[pair] HTTP POST /api/devices/pair/status status=${response.status} state=expired`); return response; }
    const response = NextResponse.json({ status: "approved" }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set({ name: "cosmic_session", value: session.token, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(session.expiresAt) });
    response.cookies.set({ name: "cosmic_device_id", value: session.deviceId, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 31536000 });
    if (process.env.NODE_ENV !== "production") console.info(`[pair] cookie-set=true HTTP POST /api/devices/pair/status status=${response.status}`);
    return response;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      const diagnostic = error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error";
      console.error(`[pair] consume-error step=route ${diagnostic}`);
      return Response.json({ error: "pairing_consume_failed", step: "route" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
    return Response.json({ error: "Device pairing is unavailable." }, { status: 503 });
  }
}
