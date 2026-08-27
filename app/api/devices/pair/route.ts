import { createDevicePairing, normalizeBootId } from "@/services/devices/pairing";
import { expiredDeviceCookie, parseDeviceCookie } from "@/services/auth/localStore";
import { allowRateLimit, requestRateKey } from "@/services/security/rateLimit";

export async function POST(request: Request) {
  if (!allowRateLimit(`pair:create:${requestRateKey(request)}`, 5, 60_000)) return Response.json({ error: "Please wait before requesting another pairing code." }, { status: 429 });
  const body = await request.json().catch(() => null) as { bootId?: unknown } | null;
  const bootId = normalizeBootId(body?.bootId);
  if (!bootId) return Response.json({ error: "A valid boot identifier is required." }, { status: 400 });
  try {
    const deviceHint = parseDeviceCookie(request);
    const result = await createDevicePairing(bootId, deviceHint ?? undefined);
    if (result.status === "identity_missing") {
      const response = Response.json({ status: result.status, reason: result.reason, error: "This display identity needs recovery before it can be paired." }, { status: 409, headers: { "Cache-Control": "no-store", ...(deviceHint ? { "Set-Cookie": expiredDeviceCookie() } : {}) } });
      if (process.env.NODE_ENV !== "production") console.info(`[pair] HTTP POST /api/devices/pair status=${response.status} state=identity_missing cookieCleared=${Boolean(deviceHint)}`);
      return response;
    }
    const response = Response.json(result, { headers: { "Cache-Control": "no-store" } }); if (process.env.NODE_ENV !== "production") console.info(`[pair] HTTP POST /api/devices/pair status=${response.status}`); return response;
  }
  catch { return Response.json({ error: "Device pairing is unavailable until durable account storage is configured." }, { status: 503 }); }
}
