import { createDevicePairing } from "@/services/devices/pairing";
import { allowRateLimit, requestRateKey } from "@/services/security/rateLimit";

export async function POST(request: Request) {
  if (!allowRateLimit(`pair:create:${requestRateKey(request)}`, 5, 60_000)) return Response.json({ error: "Please wait before requesting another pairing code." }, { status: 429 });
  try { return Response.json(await createDevicePairing(), { headers: { "Cache-Control": "no-store" } }); }
  catch { return Response.json({ error: "Device pairing is unavailable until durable account storage is configured." }, { status: 503 }); }
}
