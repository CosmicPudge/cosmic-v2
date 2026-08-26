export const TEMPORARY_KIOSK_LOCATION = {
  latitude: 41.73698,
  longitude: -111.83384,
  label: "Logan, Utah",
  city: "Logan",
  region: "Utah",
  country: "United States",
  timezone: "America/Denver",
} as const;

export const KIOSK_PHONE_LOCATION_FRESHNESS_MS = 60 * 60 * 1000;

export function isFreshKioskPhoneLocation(reportedAt: Date | string, now = Date.now()) {
  const timestamp = reportedAt instanceof Date ? reportedAt.getTime() : Date.parse(reportedAt);
  return Number.isFinite(timestamp) && now - timestamp >= 0 && now - timestamp <= KIOSK_PHONE_LOCATION_FRESHNESS_MS;
}

// TEMPORARY: Raspberry Pi kiosks do not have reliable native geolocation.
// Remove this fallback once device-configured location is fully authoritative.
