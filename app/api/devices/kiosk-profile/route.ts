import { NextResponse } from "next/server";
import { kioskBootId, requireAuthenticatedSession } from "@/services/auth/server";
import { assertDeviceOwner, readKioskDeviceProfile, saveKioskDeviceProfile, type KioskProfileInput } from "@/services/devices/kioskProfile";

function profileLog(message: string) {
  if (process.env.NODE_ENV !== "production") console.info(`[kiosk-profile] ${message}`);
}

async function targetDevice(request: Request) {
  const session = await requireAuthenticatedSession(request, { allowDevice: true, bootId: kioskBootId(request) });
  const url = new URL(request.url);
  const requested = url.searchParams.get("deviceId");
  const deviceId = session.sessionType === "device" ? session.deviceId : requested;
  if (!deviceId || !(await assertDeviceOwner(deviceId, session.account.id))) throw new Response("Device not found.", { status: 404 });
  profileLog(`request=true sessionType=${session.sessionType ?? "null"} deviceIdPresent=${Boolean(session.deviceId)} bootPresent=${Boolean(kioskBootId(request))} bootMatch=true`);
  return { session, deviceId };
}

export async function GET(request: Request) {
  try { const { deviceId } = await targetDevice(request); const profile = await readKioskDeviceProfile(deviceId); const needsSetup = !profile || !profile.setupCompleted || profile.setupVersion < 1; profileLog(`profileFound=${Boolean(profile)} needsSetup=${needsSetup} status=200 errorCode=null`); return NextResponse.json({ profile, needsSetup }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { if (error instanceof Response) { profileLog(`profileFound=false needsSetup=false status=${error.status} errorCode=PROFILE_AUTH_${error.status}`); return error; } profileLog("profileFound=false needsSetup=false status=500 errorCode=PROFILE_QUERY_FAILED"); return NextResponse.json({ error: "Kiosk profile is unavailable.", errorCode: "PROFILE_QUERY_FAILED" }, { status: 500, headers: { "Cache-Control": "no-store" } }); }
}

export async function PATCH(request: Request) {
  try {
    const { deviceId } = await targetDevice(request);
    const body = await request.json().catch(() => null) as KioskProfileInput | null;
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid kiosk profile." }, { status: 400 });
    const profile = await saveKioskDeviceProfile(deviceId, body);
    return NextResponse.json({ profile }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Kiosk profile could not be saved." }, { status: 503 }); }
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("action") !== "reset") return PATCH(request);
  try { const { deviceId } = await targetDevice(request); return NextResponse.json({ profile: await saveKioskDeviceProfile(deviceId, { setupCompleted: false, setupVersion: 0 }) }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Kiosk setup could not be reset." }, { status: 503 }); }
}
