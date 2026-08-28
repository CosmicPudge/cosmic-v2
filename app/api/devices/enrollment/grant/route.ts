import { getDeviceEnrollmentGrant } from "@/services/devices/pairing";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { challengeId?: unknown; challenge?: unknown } | null;
  if (typeof body?.challengeId !== "string" || typeof body.challenge !== "string") return Response.json({ approved: false }, { status: 400, headers: { "Cache-Control": "no-store" } });
  try {
    const result = await getDeviceEnrollmentGrant(body.challengeId, body.challenge);
    return result ? Response.json({ approved: true, challengeId: result.challengeId, grant: result.grant }, { headers: { "Cache-Control": "no-store" } }) : Response.json({ approved: false }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Device enrollment is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
