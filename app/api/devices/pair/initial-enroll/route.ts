import { completeInitialDeviceEnrollment, normalizeBootId } from "@/services/devices/pairing";

/** Consumes the one-time capability created by an unclaimed-device claim. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { deviceCode?: unknown; bootId?: unknown; deviceId?: unknown; publicNumber?: unknown; credentialHash?: unknown } | null;
  const bootId = normalizeBootId(body?.bootId);
  if ([body?.deviceCode, body?.deviceId, body?.publicNumber].some((value) => typeof value !== "string") || !bootId || typeof body?.credentialHash !== "string" || !/^[a-f0-9]{64}$/.test(body.credentialHash)) return Response.json({ enrolled: false }, { status: 400, headers: { "Cache-Control": "no-store" } });
  try {
    const result = await completeInitialDeviceEnrollment(body.deviceCode as string, bootId, body.deviceId as string, body.publicNumber as string, body.credentialHash);
    if (!result) return Response.json({ enrolled: false }, { status: 409, headers: { "Cache-Control": "no-store" } });
    return Response.json({ enrolled: true, deviceId: result.deviceId, deviceNumber: result.deviceNumber }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ enrolled: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
