import { createDevicePairing, normalizeBootId } from "@/services/devices/pairing";
import { parseDeviceCookie } from "@/services/auth/localStore";
import { allowRateLimit, requestRateKey } from "@/services/security/rateLimit";

export async function POST(request: Request) {
  if (!allowRateLimit(`pair:create:${requestRateKey(request)}`, 5, 60_000)) return Response.json({ error: "Please wait before requesting another pairing code." }, { status: 429 });
  const body = await request.json().catch(() => null) as { bootId?: unknown } | null;
  const bootId = normalizeBootId(body?.bootId);
  if (!bootId) return Response.json({ error: "A valid boot identifier is required." }, { status: 400 });
  try { const response = Response.json(await createDevicePairing(bootId, parseDeviceCookie(request) ?? undefined), { headers: { "Cache-Control": "no-store" } }); if (process.env.NODE_ENV !== "production") console.info(`[pair] HTTP POST /api/devices/pair status=${response.status}`); return response; }
  catch { return Response.json({ error: "Device pairing is unavailable until durable account storage is configured." }, { status: 503 }); }
}
