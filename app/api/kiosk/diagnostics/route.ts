import { getDeveloperKioskDiagnostics } from "@/services/kiosk/developerKiosk";
import { getDeveloperKioskSession, logDeveloperKioskAuth } from "@/services/kiosk/auth";
import { createKioskDiagnostics } from "@/services/kiosk/diagnostics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** TEMPORARY DEV KIOSK DIAGNOSTICS. Remove after provider troubleshooting. */
export async function GET(request: Request) {
  const stage = (value: Parameters<typeof getDeveloperKioskDiagnostics>[2] extends (stage: infer Stage) => void ? Stage : never) => {
    if (process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview") console.info(`[kiosk-diagnostics-server] ${value}`);
  };
  stage("start");
  const auth = await getDeveloperKioskSession(request);
  if (auth.status === "not-found") return Response.json({ error: "Not found" }, { status: 404 });
  if (auth.status === "unavailable") return Response.json({ error: "Kiosk authentication is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  if (auth.status === "unauthorized") {
    try { logDeveloperKioskAuth("diagnostics", auth.diagnostics); } catch { /* Safe debug logging must never affect auth. */ }
    return Response.json({ error: "Authentication required.", auth: auth.diagnostics }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const diagnostics = createKioskDiagnostics();
  stage("auth=ok");
  try {
    await getDeveloperKioskDiagnostics(request, diagnostics, stage);
    stage("response=ready");
    return Response.json({ runtime: { authenticated: true, environment: "dev", runtimeReady: true }, ...diagnostics }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Diagnostics are temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
