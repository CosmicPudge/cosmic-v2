import { requireCosmicAccount } from "@/services/auth/server";
import { assertSameOrigin } from "@/services/security/origin";
import { denyDevicePairing } from "@/services/devices/pairing";

export async function POST(request: Request) {
  try { assertSameOrigin(request); const account = await requireCosmicAccount(request); const body = await request.json().catch(() => null) as { userCode?: unknown } | null; if (typeof body?.userCode !== "string" || !(await denyDevicePairing(body.userCode, account.id))) return Response.json({ error: "That code is invalid or expired." }, { status: 404 }); return Response.json({ denied: true }); }
  catch (error) { if (error instanceof Response) return error; return Response.json({ error: "Device denial is unavailable." }, { status: 503 }); }
}
