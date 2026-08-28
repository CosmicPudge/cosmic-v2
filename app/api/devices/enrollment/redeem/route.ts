import { finalizeDeviceEnrollment } from "@/services/devices/pairing";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { challengeId?: unknown; challenge?: unknown; grant?: unknown; credential?: unknown } | null;
  if (typeof body?.challengeId !== "string" || typeof body.challenge !== "string" || typeof body.grant !== "string" || typeof body.credential !== "string" || body.credential.length < 32) return Response.json({ enrolled: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    const result = await finalizeDeviceEnrollment(body.challengeId, body.challenge, body.grant, body.credential);
    return result ? Response.json({ enrolled: true, finalized: true, alreadyFinalized: result.alreadyFinalized, deviceId: result.deviceId, ...(result.deviceNumber ? { deviceNumber: result.deviceNumber } : {}) }, { headers: { "Cache-Control": "no-store" } }) : Response.json({ enrolled: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Device enrollment is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
