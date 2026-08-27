import { NextResponse } from "next/server";
import { authenticateDeviceCredential } from "@/services/devices/pairing";
import { deviceCredentialCookie, parseDeviceCredentialCookie, sessionCookie } from "@/services/auth/localStore";
import { normalizeBootId } from "@/services/devices/pairing";

/**
 * Bootstrap a fresh device session from the credential held by the kiosk
 * helper. The browser fallback uses an HttpOnly cookie; a future Pi helper
 * may send the same credential as an Authorization Bearer value.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { bootId?: unknown } | null;
  const bootId = normalizeBootId(body?.bootId);
  if (!bootId) return Response.json({ error: "A valid boot identifier is required." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  const authorization = request.headers.get("authorization");
  const credential = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : parseDeviceCredentialCookie(request);
  if (!credential) return Response.json({ authenticated: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    const session = await authenticateDeviceCredential(credential, bootId, request.headers.get("user-agent") ?? undefined);
    if (!session) return Response.json({ authenticated: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
    if (session.state !== "owned") return NextResponse.json({ authenticated: false, state: session.state, deviceId: session.deviceId, deviceNumber: session.deviceNumber }, { headers: { "Cache-Control": "no-store" } });
    const response = NextResponse.json({ authenticated: true, state: "owned", sessionType: "device", deviceId: session.deviceId, deviceNumber: session.deviceNumber }, { headers: { "Cache-Control": "no-store" } });
    response.headers.append("Set-Cookie", sessionCookie(session.token, session.expiresAt));
    response.headers.append("Set-Cookie", deviceCredentialCookie(credential));
    return response;
  } catch {
    return Response.json({ error: "Device bootstrap is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
