import { getDeveloperKioskData, isDeveloperKioskRequest } from "@/services/kiosk/developerKiosk";
import { getCurrentCosmicSession, kioskBootId } from "@/services/auth/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isDeveloperKioskRequest(request)) return Response.json({ error: "Not found" }, { status: 404 });
  const startedAt = Date.now();
  let session: Awaited<ReturnType<typeof getCurrentCosmicSession>>;
  try {
    session = await getCurrentCosmicSession(request, { allowUser: false, allowDevice: true, bootId: kioskBootId(request) });
  } catch {
    if (process.env.NODE_ENV !== "production") console.info(`[kiosk-data] status=503 auth=unavailable category=auth-error durationMs=${Date.now() - startedAt}`);
    return Response.json({ error: "Kiosk authentication is temporarily unavailable.", category: "auth-error" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  if (!session) {
    if (process.env.NODE_ENV !== "production") console.info(`[kiosk-data] status=401 auth=session_expired durationMs=${Date.now() - startedAt}`);
    return Response.json({ error: "Authentication required.", category: "session-expired" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const value = await getDeveloperKioskData(request);
    if (process.env.NODE_ENV !== "production") console.info(`[kiosk-data] status=200 auth=ok weather=${Boolean(value.weather) ? "ok" : "degraded"} calendar=${value.calendar.connected ? "ok" : "degraded"} school=${value.school.connected ? "ok" : "degraded"} durationMs=${Date.now() - startedAt}`);
    return Response.json(value, { headers: { "Cache-Control": "no-store" } });
  } catch {
    if (process.env.NODE_ENV !== "production") console.info(`[kiosk-data] status=503 auth=ok category=aggregate-error durationMs=${Date.now() - startedAt}`);
    return Response.json({ error: "Kiosk data is temporarily unavailable.", category: "aggregate-error" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
