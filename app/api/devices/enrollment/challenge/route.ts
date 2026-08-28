import { createDeviceEnrollmentChallenge } from "@/services/devices/pairing";
import { allowRateLimit, requestRateKey } from "@/services/security/rateLimit";

export async function POST(request: Request) {
  if (!allowRateLimit(`device-enrollment:challenge:${requestRateKey(request)}`, 5, 60_000)) return Response.json({ error: "Please wait before requesting another enrollment challenge." }, { status: 429 });
  const body = await request.json().catch(() => null) as { deviceId?: unknown; publicNumber?: unknown; challenge?: unknown } | null;
  if (typeof body?.deviceId !== "string" || typeof body.publicNumber !== "string" || typeof body.challenge !== "string" || body.challenge.length < 32) return Response.json({ error: "Invalid enrollment challenge." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  try {
    const result = await createDeviceEnrollmentChallenge(body.deviceId, body.publicNumber, body.challenge);
    return result ? Response.json(result, { headers: { "Cache-Control": "no-store" } }) : Response.json({ error: "Device identity is not eligible for enrollment." }, { status: 409, headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Device enrollment is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
