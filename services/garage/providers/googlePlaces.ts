import type { RepairShop, RepairShopProvider } from "./external";

export function createGooglePlacesRepairShopProvider(apiKey = process.env.GOOGLE_MAPS_PLATFORM_API_KEY): RepairShopProvider {
  return {
    id: "google-places",
    async findNearby(request) {
      if (!apiKey) return [];
      const response = await fetch("https://places.googleapis.com/v1/places:searchText", { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json", "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.googleMapsUri,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.regularOpeningHours.weekdayDescriptions,places.location" }, body: JSON.stringify({ textQuery: request.service ? `${request.service} auto repair` : "auto repair shop", ...(request.latitude !== undefined && request.longitude !== undefined ? { locationBias: { circle: { center: { latitude: request.latitude, longitude: request.longitude }, radius: request.radiusMeters ?? 16000 } } } : {}), ...(request.query ? { textQuery: request.query } : {}) }) });
      if (!response.ok) throw new Error(`Google Places returned ${response.status}`);
      const payload = await response.json() as { places?: Array<Record<string, unknown>> };
      return (payload.places ?? []).map((place): RepairShop => { const displayName = place.displayName as { text?: string } | undefined; const hours = place.regularOpeningHours as { weekdayDescriptions?: string[] } | undefined; return { id: String(place.id ?? ""), name: displayName?.text ?? "Unnamed repair shop", address: typeof place.formattedAddress === "string" ? place.formattedAddress : undefined, website: typeof place.googleMapsUri === "string" ? place.googleMapsUri : undefined, phone: typeof place.nationalPhoneNumber === "string" ? place.nationalPhoneNumber : undefined, rating: typeof place.rating === "number" ? place.rating : undefined, reviewCount: typeof place.userRatingCount === "number" ? place.userRatingCount : undefined, hours: hours?.weekdayDescriptions, source: "Google Places", pricingAvailability: "not-published" }; });
    },
  };
}
