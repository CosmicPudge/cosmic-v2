import { NextResponse } from "next/server";
import { getCurrentCosmicAccount } from "@/services/auth/server";
import { getAccountEntitlements } from "@/services/entitlements/service";
import { createGooglePlacesRepairShopProvider } from "@/services/garage/providers/googlePlaces";
import { assertSameOrigin } from "@/services/security/origin";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  assertSameOrigin(request);
  const account = await getCurrentCosmicAccount(request);
  if (!account) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const entitlements = await getAccountEntitlements(account.id);
  if (!entitlements.features["garage.advanced"]) return NextResponse.json({ error: "Repair options are included with Cosmic+. You can continue manually." }, { status: 403 });
  const body = await request.json().catch(() => null) as { query?: unknown; service?: unknown; latitude?: unknown; longitude?: unknown; radiusMeters?: unknown } | null;
  const query = typeof body?.query === "string" ? body.query.trim().slice(0, 200) : "";
  if (!query) return NextResponse.json({ error: "Enter a city, ZIP code, or approved location." }, { status: 400 });
  if (!process.env.GOOGLE_MAPS_PLATFORM_API_KEY) return NextResponse.json({ error: "Local shop discovery is not configured yet." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  try { const shops = await createGooglePlacesRepairShopProvider().findNearby({ query, service: typeof body?.service === "string" ? body.service.slice(0, 100) : undefined, latitude: typeof body?.latitude === "number" ? body.latitude : undefined, longitude: typeof body?.longitude === "number" ? body.longitude : undefined, radiusMeters: typeof body?.radiusMeters === "number" ? Math.min(Math.max(body.radiusMeters, 1000), 50000) : undefined }); return NextResponse.json({ shops }, { headers: { "Cache-Control": "no-store" } }); } catch { return NextResponse.json({ error: "Local shop discovery is temporarily unavailable." }, { status: 502, headers: { "Cache-Control": "no-store" } }); }
}
