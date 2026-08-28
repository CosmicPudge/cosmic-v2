import { createDeviceSessionHandoff, normalizeBootId } from "@/services/devices/pairing";

/** Helper-only endpoint: the permanent credential is accepted, never returned. */
export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const credential = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  const body = await request.json().catch(() => null) as { bootId?: unknown } | null;
  const bootId = normalizeBootId(body?.bootId);
  if (!credential || !bootId) return Response.json({ authenticated: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    const handoff = await createDeviceSessionHandoff(credential, bootId);
    if (!handoff) return Response.json({ authenticated: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
    return Response.json({ authenticated: true, sessionType: "device", deviceId: handoff.deviceId, handoffToken: handoff.token, expiresAt: handoff.expiresAt }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Device session handoff is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
