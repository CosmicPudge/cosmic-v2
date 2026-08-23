import type { VehicleVinSpecifications } from "@/core/contracts/Garage";

const fieldMap: Record<string, keyof VehicleVinSpecifications> = { ModelYear: "modelYear", Make: "make", Model: "model", Trim: "trim", VehicleType: "vehicleType", BodyClass: "bodyClass", Manufacturer: "manufacturer", EngineCylinders: "engineCylinders", DisplacementL: "displacement", FuelTypePrimary: "fuelType", DriveType: "driveType", TransmissionStyle: "transmission" };

export async function decodeVinWithNhtsa(vin: string): Promise<Partial<VehicleVinSpecifications>> {
  const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${encodeURIComponent(vin)}?format=json`, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("NHTSA unavailable");
  const payload = await response.json() as { Results?: Array<Record<string, unknown>> };
  const raw = payload.Results?.[0];
  if (!raw) throw new Error("NHTSA returned no result");
  const specifications: Record<string, string> = {};
  for (const [providerKey, outputKey] of Object.entries(fieldMap)) { const value = raw[providerKey]; if (typeof value === "string" && value.trim() && !["0", "Not Applicable", "Not Available", "null"].includes(value.trim())) specifications[outputKey] = value.trim(); }
  return specifications as Partial<VehicleVinSpecifications>;
}
