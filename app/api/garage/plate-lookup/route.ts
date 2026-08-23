import { NextResponse } from "next/server";
import { getCurrentCosmicAccount } from "@/services/auth/server";
import { getAccountEntitlements } from "@/services/entitlements/service";
import { createCarsXePlateProvider, normalizePlate, normalizeRegion } from "@/services/garage/providers/carsxe";
import { decodeVinWithNhtsa } from "@/services/garage/providers/nhtsa";
import { assertSameOrigin } from "@/services/security/origin";

export const dynamic = "force-dynamic";
const requests = new Map<string, Promise<Response> | undefined>();
type ResponsePayload = { provider?: string; plate?: string; region?: string; country?: string; vin?: string; specifications?: Record<string, string>; error?: string; errorCode?: string; sources?: string[] };
type Response = NextResponse<ResponsePayload>;
const json = (body: ResponsePayload, status = 200): Response => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  assertSameOrigin(request);
  const account = await getCurrentCosmicAccount(request);
  if (!account) return json({ error: "Sign in and upgrade to Cosmic+ to use license plate lookup." }, 401);
  const entitlements = await getAccountEntitlements(account.id);
  if (!entitlements.features["garage.advanced"]) return json({ error: "License plate lookup is available with Cosmic+. Enter the vehicle manually on Free." }, 403);
  const body = await request.json().catch(() => null) as { plate?: unknown; region?: unknown; country?: unknown } | null;
  const plate = typeof body?.plate === "string" ? normalizePlate(body.plate) : "";
  const region = typeof body?.region === "string" ? normalizeRegion(body.region) : "";
  const country = typeof body?.country === "string" && body.country.trim() ? body.country.trim().toUpperCase() : "US";
  if (!plate || !region || !/^[A-Z0-9 -]{2,12}$/.test(plate) || !/^[A-Z]{2}$/.test(region) || country !== "US") return json({ error: "Enter a valid U.S. plate and state." }, 400);
  const key = `${account.id}:${country}:${region}:${plate}`;
  const existing = requests.get(key);
  if (existing) return existing;
  const operation = (async () => {
    try {
      const result = await createCarsXePlateProvider().lookup({ plate, region, country });
      if (result.availability !== "available") return json({ provider: result.provider, plate, region, country, error: result.errorCode === "unconfigured" ? "License plate lookup is not configured yet." : result.errorCode === "not_found" ? "No vehicle was found for that plate and state." : result.errorCode === "rate_limited" ? "The plate lookup provider is temporarily rate-limited." : "License plate lookup is temporarily unavailable.", errorCode: result.errorCode }, result.errorCode === "not_found" ? 404 : result.errorCode === "invalid" ? 400 : result.errorCode === "unconfigured" ? 503 : 502);
      let specifications: Record<string, string> = {};
      const sources = [result.provider];
      if (result.vin) {
        try { specifications = await decodeVinWithNhtsa(result.vin) as Record<string, string>; sources.push("NHTSA vPIC"); } catch { /* The plate result remains usable without NHTSA enrichment. */ }
      }
      return json({ provider: result.provider, plate: result.plate, region: result.region, country: result.country, vin: result.vin, specifications: { ...specifications, ...(result.year ? { modelYear: result.year } : {}), ...(result.make ? { make: result.make } : {}), ...(result.model ? { model: result.model } : {}), ...(result.trim ? { trim: result.trim } : {}) }, sources });
    } finally { requests.delete(key); }
  })();
  requests.set(key, operation);
  return operation;
}
