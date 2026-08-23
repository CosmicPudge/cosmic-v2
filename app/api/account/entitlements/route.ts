import { resolveEntitlements } from "@/services/entitlements/service";

export async function GET(request: Request) {
  return Response.json(await resolveEntitlements(request), { headers: { "Cache-Control": "no-store" } });
}
