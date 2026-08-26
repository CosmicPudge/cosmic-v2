export const TEMPORARY_KIOSK_LOCATION = {
  latitude: 41.73698,
  longitude: -111.83384,
  label: "Logan, Utah",
  city: "Logan",
  region: "Utah",
  country: "United States",
  timezone: "America/Denver",
} as const;

// TEMPORARY: Raspberry Pi kiosks do not have reliable native geolocation.
// Remove this fallback once device-configured location is fully authoritative.
