import { getDeviceProvisioningState } from "@/services/devices/pairing";

/** Public, identifier-only lifecycle check for a credential-less trusted helper. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { deviceId?: unknown; publicNumber?: unknown } | null;
  if (typeof body?.deviceId !== "string" || typeof body.publicNumber !== "string") return Response.json({ state: "temporary_failure" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  try {
    const result = await getDeviceProvisioningState(body.deviceId, body.publicNumber);
    return Response.json(result, { status: result.state === "identity_recovery" ? 409 : 200, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ state: "temporary_failure" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
