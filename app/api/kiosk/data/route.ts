import { getDeveloperKioskData } from "@/services/kiosk/developerKiosk";
import { getDeveloperKioskSession, inspectDeveloperKioskSession, logDeveloperKioskAuth } from "@/services/kiosk/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview") {
    try { logDeveloperKioskAuth("data", await inspectDeveloperKioskSession(request)); } catch { /* Safe debug logging must never affect auth. */ }
  }
  const auth = await getDeveloperKioskSession(request);
  if (auth.status === "not-found") return Response.json({ error: "Not found" }, { status: 404 });
  const startedAt = Date.now();
  if (auth.status === "unavailable") {
    if (process.env.NODE_ENV !== "production") console.info(`[kiosk-data] status=503 auth=unavailable category=auth-error durationMs=${Date.now() - startedAt}`);
    return Response.json({ error: "Kiosk authentication is temporarily unavailable.", category: "auth-error" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  if (auth.status === "unauthorized") {
    const host = new URL(request.url).hostname.toLowerCase();
    const localDevelopment = process.env.NODE_ENV !== "production" && (host === "localhost" || host === "127.0.0.1");
    if (!localDevelopment) {
      if (process.env.NODE_ENV !== "production") console.info(`[kiosk-data] status=401 auth=session_expired durationMs=${Date.now() - startedAt}`);
      return Response.json({ error: "Authentication required.", category: "session-expired" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    try {
      const value = await getDeveloperKioskData(request);
      if (process.env.NODE_ENV !== "production") console.info(`[kiosk-data] status=200 auth=local-dev weather=${Boolean(value.weather) ? "ok" : "degraded"} calendar=${value.calendar.connected ? "ok" : "degraded"} school=${value.school.connected ? "ok" : "degraded"} durationMs=${Date.now() - startedAt}`);
      return Response.json(value, { headers: { "Cache-Control": "no-store" } });
    } catch {
      if (process.env.NODE_ENV !== "production") console.info(`[kiosk-data] status=503 auth=local-dev category=aggregate-error durationMs=${Date.now() - startedAt}`);
      return Response.json({ error: "Kiosk data is temporarily unavailable.", category: "aggregate-error" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
  }
  try {
    const value = await getDeveloperKioskData(request, undefined, auth.session.account.id);
    if (process.env.NODE_ENV !== "production") console.info(`[kiosk-data] status=200 auth=ok weather=${Boolean(value.weather) ? "ok" : "degraded"} calendar=${value.calendar.connected ? "ok" : "degraded"} school=${value.school.connected ? "ok" : "degraded"} durationMs=${Date.now() - startedAt}`);
    return Response.json(value, { headers: { "Cache-Control": "no-store" } });
  } catch {
    if (process.env.NODE_ENV !== "production") console.info(`[kiosk-data] status=503 auth=ok category=aggregate-error durationMs=${Date.now() - startedAt}`);
    return Response.json({ error: "Kiosk data is temporarily unavailable.", category: "aggregate-error" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
