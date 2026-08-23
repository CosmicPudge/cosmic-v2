import { NextResponse } from "next/server";
import { getCurrentCosmicAccount } from "@/services/auth/server";
import { getAccountEntitlements } from "@/services/entitlements/service";

export const dynamic = "force-dynamic";

const vinPattern = /^[A-HJ-NPR-Z0-9]{17}$/;
const fieldMap: Record<string, string> = { ModelYear: "modelYear", Make: "make", Model: "model", Trim: "trim", VehicleType: "vehicleType", BodyClass: "bodyClass", Manufacturer: "manufacturer", EngineCylinders: "engineCylinders", DisplacementL: "displacement", FuelTypePrimary: "fuelType", DriveType: "driveType", TransmissionStyle: "transmission" };

export async function GET(request: Request, context: { params: Promise<{ vin: string }> }) {
  const account = await getCurrentCosmicAccount(request);
  if (!account) return NextResponse.json({ error: "Sign in and upgrade to Cosmic+ to use automatic vehicle lookup. You can enter the vehicle manually on Free." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const entitlements = await getAccountEntitlements(account.id);
  if (!entitlements.features["garage.advanced"]) return NextResponse.json({ error: "Automatic vehicle lookup is available with Cosmic+. Enter the vehicle manually to continue." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  const vin = (await context.params).vin.trim().toUpperCase();
  if (!vinPattern.test(vin)) return NextResponse.json({ error: "Enter a 17-character VIN using valid VIN characters." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  try {
    const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(vin)}?format=json`, { cache: "no-store", headers: { Accept: "application/json" } });
    if (!response.ok) return NextResponse.json({ error: "VIN decoding temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
    const payload = await response.json() as { Results?: Array<Record<string, unknown>> };
    const raw = payload.Results?.[0];
    if (!raw) return NextResponse.json({ error: "VIN decoding returned no result." }, { status: 422, headers: { "Cache-Control": "no-store" } });
    const specifications: Record<string, string> = {};
    for (const [providerKey, outputKey] of Object.entries(fieldMap)) { const value = raw[providerKey]; if (typeof value === "string" && value.trim() && !["0", "Not Applicable", "Not Available", "null"].includes(value.trim())) specifications[outputKey] = value.trim(); }
    return NextResponse.json({ source: "nhtsa-vpic", decodedAt: new Date().toISOString(), specifications }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "VIN decoding temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
