import { getDeveloperKioskData, isDeveloperKioskRequest } from "@/services/kiosk/developerKiosk";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isDeveloperKioskRequest(request)) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(await getDeveloperKioskData(request), { headers: { "Cache-Control": "no-store" } });
}
