import { requireCosmicAccount } from "@/services/auth/server";
import { assertSameOrigin } from "@/services/security/origin";
import { authorizeDeviceEnrollment } from "@/services/devices/pairing";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const account = await requireCosmicAccount(request);
    const body = await request.json().catch(() => null) as { challengeId?: unknown } | null;
    if (typeof body?.challengeId !== "string") return Response.json({ error: "An enrollment challenge is required." }, { status: 400 });
    const result = await authorizeDeviceEnrollment(body.challengeId, account.id);
    return result ? Response.json(result, { headers: { "Cache-Control": "no-store" } }) : Response.json({ error: "Enrollment challenge is invalid, expired, or not owned by this account." }, { status: 409, headers: { "Cache-Control": "no-store" } });
  } catch (error) { if (error instanceof Response) return error; return Response.json({ error: "Device enrollment authorization is unavailable." }, { status: 503 }); }
}
