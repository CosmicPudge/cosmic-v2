import { NextResponse } from "next/server";
import { kioskBootId, requireAuthenticatedSession } from "@/services/auth/server";
import { deviceCredentialCookie } from "@/services/auth/localStore";
import { provisionDeviceCredential } from "@/services/devices/pairing";

/** One-time upgrade path for device rows created before persistent credentials existed. */
export async function POST(request: Request) {
  try {
    const session = await requireAuthenticatedSession(request, { allowDevice: true, bootId: kioskBootId(request) });
    if (session.sessionType !== "device" || !session.deviceId) return Response.json({ error: "A device session is required." }, { status: 403, headers: { "Cache-Control": "no-store" } });
    const result = await provisionDeviceCredential(session.account.id, session.deviceId);
    if (!result) return Response.json({ error: "Device not found." }, { status: 404, headers: { "Cache-Control": "no-store" } });
    const response = NextResponse.json({ provisioned: result.provisioned, deviceId: result.deviceId, deviceNumber: result.deviceNumber, ...(result.provisioned ? { credential: result.credential } : {}) }, { headers: { "Cache-Control": "no-store" } });
    if (result.provisioned) response.headers.append("Set-Cookie", deviceCredentialCookie(result.credential));
    return response;
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Device credential provisioning is unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
