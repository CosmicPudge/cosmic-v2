import { getDeveloperKioskData } from "@/services/kiosk/developerKiosk";
import { getDeveloperKioskSession, inspectDeveloperKioskSession, logDeveloperKioskAuth } from "@/services/kiosk/auth";
import { createKioskDiagnostics } from "@/services/kiosk/diagnostics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** TEMPORARY DEV KIOSK DIAGNOSTICS. Remove after provider troubleshooting. */
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview") {
    try { logDeveloperKioskAuth("diagnostics", await inspectDeveloperKioskSession(request)); } catch { /* Safe debug logging must never affect auth. */ }
  }
  const auth = await getDeveloperKioskSession(request);
  if (auth.status === "not-found") return Response.json({ error: "Not found" }, { status: 404 });
  if (auth.status === "unavailable") return Response.json({ error: "Kiosk authentication is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  if (auth.status === "unauthorized") return Response.json({ error: "Authentication required." }, { status: 401, headers: { "Cache-Control": "no-store" } });

  const diagnostics = createKioskDiagnostics();
  await getDeveloperKioskData(request, diagnostics);
  return Response.json({ runtime: { authenticated: true, environment: "dev", runtimeReady: true }, ...diagnostics }, { headers: { "Cache-Control": "no-store" } });
}
