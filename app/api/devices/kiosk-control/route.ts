import { kioskBootId, requireAuthenticatedSession, requireCosmicAccount } from "@/services/auth/server";
import { assertSameOrigin } from "@/services/security/origin";
import { assertDeviceOwner } from "@/services/devices/kioskProfile";
import { applyKioskSlideshowCommand, readKioskSlideshowState, reportKioskSlideshowState } from "@/services/devices/kioskSlideshow";
import type { KioskSlideshowCommand, KioskSlideshowPauseReason } from "@/core/contracts/Kiosk";

const commands = new Set<KioskSlideshowCommand>(["pause", "resume", "next", "previous"]);
const pauseReasons = new Set<Exclude<KioskSlideshowPauseReason, null>>(["manual", "preview"]);

async function sessionForRequest(request: Request) {
  return requireAuthenticatedSession(request, { allowDevice: true, bootId: kioskBootId(request) });
}

export async function GET(request: Request) {
  try {
    const session = await sessionForRequest(request);
    const url = new URL(request.url);
    const deviceId = session.sessionType === "device" ? session.deviceId : url.searchParams.get("deviceId");
    if (!deviceId || !(await assertDeviceOwner(deviceId, session.account.id))) return Response.json({ error: "Device not found." }, { status: 404 });
    return Response.json(await readKioskSlideshowState(deviceId, session.sessionType === "device" ? kioskBootId(request) : undefined), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Kiosk control state is unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const action = body?.action;
    if (typeof action !== "string") return Response.json({ error: "A kiosk control action is required." }, { status: 400 });

    const session = await sessionForRequest(request);
    if (action === "report") {
      if (session.sessionType !== "device" || !session.deviceId) return Response.json({ error: "Only a kiosk may report slideshow state." }, { status: 403 });
      const bootId = kioskBootId(request);
      if (!bootId || typeof body?.currentSlide !== "string" || typeof body?.paused !== "boolean" || (body.pauseReason !== null && (typeof body.pauseReason !== "string" || !pauseReasons.has(body.pauseReason as Exclude<KioskSlideshowPauseReason, null>))) || typeof body?.appliedCommandRevision !== "number") return Response.json({ error: "Invalid kiosk state report." }, { status: 400 });
      const state = await reportKioskSlideshowState(session.deviceId, { bootId, currentSlide: body.currentSlide.slice(0, 80), paused: body.paused, pauseReason: body.pauseReason as KioskSlideshowPauseReason, appliedCommandRevision: Math.floor(body.appliedCommandRevision) });
      return Response.json(state, { headers: { "Cache-Control": "no-store" } });
    }
    if (!commands.has(action as KioskSlideshowCommand)) return Response.json({ error: "Unknown kiosk control action." }, { status: 400 });
    if (session.sessionType === "device") return Response.json({ error: "A kiosk cannot issue remote control commands." }, { status: 403 });
    const account = await requireCosmicAccount(request);
    const deviceId = typeof body?.deviceId === "string" ? body.deviceId : null;
    if (!deviceId || !(await assertDeviceOwner(deviceId, account.id))) return Response.json({ error: "Device not found." }, { status: 404 });
    return Response.json(await applyKioskSlideshowCommand(deviceId, action as KioskSlideshowCommand), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Kiosk control action failed." }, { status: 503 });
  }
}
