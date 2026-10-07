import { getCurrentCosmicSession, kioskBootId } from "@/services/auth/server";
import { getDeveloperKioskData, isDeveloperKioskRequest } from "@/services/kiosk/developerKiosk";
import { createKioskDiagnostics } from "@/services/kiosk/diagnostics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** TEMPORARY DEV KIOSK DIAGNOSTICS. Remove after provider troubleshooting. */
export async function GET(request: Request) {
  if (!isDeveloperKioskRequest(request)) return Response.json({ error: "Not found" }, { status: 404 });
  const session = await getCurrentCosmicSession(request, { allowUser: false, allowDevice: true, bootId: kioskBootId(request) });
  if (!session) return Response.json({ error: "Authentication required." }, { status: 401, headers: { "Cache-Control": "no-store" } });

  const diagnostics = createKioskDiagnostics();
  await getDeveloperKioskData(request, diagnostics);
  return Response.json({ runtime: { authenticated: true, environment: "dev", runtimeReady: true }, ...diagnostics }, { headers: { "Cache-Control": "no-store" } });
}
