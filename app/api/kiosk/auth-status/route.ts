import { isDeveloperKioskRequest } from "@/services/kiosk/developerKiosk";
import { inspectDeveloperKioskAuthStatus } from "@/services/kiosk/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** TEMPORARY DEV KIOSK AUTH STATUS. Remove after provider troubleshooting. */
export async function GET(request: Request) {
  if (!isDeveloperKioskRequest(request)) return Response.json({ error: "Not found" }, { status: 404 });
  try {
    const auth = await inspectDeveloperKioskAuthStatus(request);
    return Response.json(auth, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Kiosk authentication status is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
