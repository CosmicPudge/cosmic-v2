import { NextResponse } from "next/server";
import { consumeDeviceSessionHandoff, normalizeBootId } from "@/services/devices/pairing";
import { DEVICE_SESSION_COOKIE_MAX_AGE_SECONDS } from "@/services/auth/localStore";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { bootId?: unknown; handoffToken?: unknown } | null;
  const bootId = normalizeBootId(body?.bootId);
  if (!bootId || typeof body?.handoffToken !== "string" || body.handoffToken.length < 32) return Response.json({ authenticated: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    const session = await consumeDeviceSessionHandoff(body.handoffToken, bootId, request.headers.get("user-agent") ?? undefined);
    if (!session) return Response.json({ authenticated: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
    const response = NextResponse.json({ authenticated: true, sessionType: "device", deviceId: session.deviceId }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set({ name: "cosmic_session", value: session.token, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: Math.min(DEVICE_SESSION_COOKIE_MAX_AGE_SECONDS, Math.max(0, Math.floor((Date.parse(session.expiresAt) - Date.now()) / 1000))) });
    response.cookies.set({ name: "cosmic_device_id", value: session.deviceId, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 31536000 });
    return response;
  } catch {
    return Response.json({ error: "Device session handoff is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
