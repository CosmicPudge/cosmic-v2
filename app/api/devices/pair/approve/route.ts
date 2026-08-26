import { requireCosmicAccount } from "@/services/auth/server";
import { assertSameOrigin } from "@/services/security/origin";
import { approveDevicePairing } from "@/services/devices/pairing";
import { allowRateLimit, requestRateKey } from "@/services/security/rateLimit";

export async function POST(request: Request) {
  try { assertSameOrigin(request); const account = await requireCosmicAccount(request); if (!allowRateLimit(`pair:approve:${requestRateKey(request)}:${account.id}`, 10, 60_000)) return Response.json({ error: "Too many attempts. Please wait." }, { status: 429 }); const body = await request.json().catch(() => null) as { userCode?: unknown } | null; if (typeof body?.userCode !== "string") return Response.json({ error: "Enter the display code." }, { status: 400 }); if (!(await approveDevicePairing(body.userCode, account.id))) return Response.json({ error: "That code is invalid or expired." }, { status: 404 }); const response = Response.json({ approved: true }, { headers: { "Cache-Control": "no-store" } }); if (process.env.NODE_ENV !== "production") console.info(`[pair] HTTP POST /api/devices/pair/approve status=${response.status}`); return response; }
  catch (error) { if (error instanceof Response) return error; return Response.json({ error: "Device approval is unavailable." }, { status: 503 }); }
}
