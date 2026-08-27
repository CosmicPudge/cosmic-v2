import { resetDeviceWithCredential } from "@/services/devices/pairing";

/**
 * Physical-reset contract for the future Pi helper. This intentionally does
 * not accept a public device number, activation code, browser session, or
 * credential cookie: only the helper's current private credential authorizes
 * a reset.
 */
export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const credential = request.headers.get("x-cosmic-device-credential")
    ?? (authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : null);
  if (!credential) return Response.json({ error: "Physical device authorization required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  try {
    const reset = await resetDeviceWithCredential(credential);
    if (!reset) return Response.json({ error: "Device credential is invalid or revoked." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    return Response.json({ reset: true, deviceId: reset.deviceId, deviceNumber: reset.deviceNumber, nextCredential: reset.credential }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Physical device reset is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
