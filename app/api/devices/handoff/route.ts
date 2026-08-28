import { createDeviceSessionHandoff, normalizeBootId } from "@/services/devices/pairing";

/** Helper-only endpoint: the permanent credential is accepted, never returned. */
export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const credential = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  const body = await request.json().catch(() => null) as { bootId?: unknown; deviceId?: unknown; publicNumber?: unknown } | null;
  const bootId = normalizeBootId(body?.bootId);
  if (!credential || !bootId) return Response.json({ authenticated: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    const identity = typeof body?.deviceId === "string" && typeof body?.publicNumber === "string" ? { deviceId: body.deviceId, publicNumber: body.publicNumber } : undefined;
    const handoff = await createDeviceSessionHandoff(credential, bootId, identity);
    if (!handoff) return Response.json({ authenticated: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
    if ("state" in handoff) return Response.json(handoff, { status: 409, headers: { "Cache-Control": "no-store" } });
    return Response.json({ authenticated: true, sessionType: "device", deviceId: handoff.deviceId, handoffToken: handoff.token, expiresAt: handoff.expiresAt }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Device session handoff is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
