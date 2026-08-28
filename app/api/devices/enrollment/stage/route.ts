import { stageDeviceEnrollment } from "@/services/devices/pairing";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { challengeId?: unknown; challenge?: unknown; grant?: unknown; credentialHash?: unknown } | null;
  if (typeof body?.challengeId !== "string" || typeof body.challenge !== "string" || typeof body.grant !== "string" || typeof body.credentialHash !== "string" || !/^[a-f0-9]{64}$/.test(body.credentialHash)) return Response.json({ staged: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    const result = await stageDeviceEnrollment(body.challengeId, body.challenge, body.grant, body.credentialHash);
    return result ? Response.json(result, { headers: { "Cache-Control": "no-store" } }) : Response.json({ staged: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Device enrollment is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
