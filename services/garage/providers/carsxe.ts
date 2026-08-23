import type { PlateLookupProvider, PlateLookupRequest, PlateLookupResult } from "./external";

const endpoint = "https://api.carsxe.com/v2/platedecoder";

export function normalizePlate(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, " ");
}

export function normalizeRegion(value: string): string {
  return value.trim().toUpperCase();
}

export function createCarsXePlateProvider(apiKey = process.env.CARSXE_API_KEY): PlateLookupProvider {
  return {
    id: "carsxe",
    async lookup(request: PlateLookupRequest): Promise<PlateLookupResult> {
      const plate = normalizePlate(request.plate);
      const region = normalizeRegion(request.region);
      const country = (request.country ?? "US").trim().toUpperCase();
      if (!apiKey) return { provider: "CarsXE", plate, region, country, availability: "unavailable", errorCode: "unconfigured" };
      const url = new URL(endpoint);
      url.searchParams.set("key", apiKey);
      url.searchParams.set("plate", plate);
      url.searchParams.set("state", region);
      url.searchParams.set("country", country);
      try {
        const response = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
        const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
        if (!response.ok || payload.success === false) {
          const errorCode = response.status === 404 ? "not_found" : response.status === 429 ? "rate_limited" : response.status === 400 ? "invalid" : response.status === 401 || response.status === 403 ? "unconfigured" : "unavailable";
          return { provider: "CarsXE", plate, region, country, availability: "unavailable", errorCode };
        }
        const text = (key: string) => typeof payload[key] === "string" && String(payload[key]).trim() ? String(payload[key]).trim() : undefined;
        return { provider: "CarsXE", plate, region, country, vin: text("vin"), year: text("year"), make: text("make"), model: text("model"), trim: text("trim"), vehicleType: text("body_style"), providerReference: text("vin"), availability: "available" };
      } catch {
        return { provider: "CarsXE", plate, region, country, availability: "unavailable", errorCode: "unavailable" };
      }
    },
  };
}
