export type DeviceLocationSource = "current" | "last-known" | "fallback" | "unavailable";

export interface DeviceLocationState {
  source: DeviceLocationSource;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  resolvedAt?: string;
  stale: boolean;
  city?: string;
  region?: string;
  country?: string;
  timezone?: string;
  label?: string;
}

export interface DeviceLocationCandidate {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  resolvedAt?: string;
  city?: string;
  region?: string;
  country?: string;
  timezone?: string;
  label?: string;
}

export const DEVICE_LOCATION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const DEVICE_LOCATION_MOVE_THRESHOLD_METERS = 25_000;

export function isValidDeviceCoordinate(latitude: number, longitude: number) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

export function deviceLocationDistanceMeters(left: Pick<DeviceLocationCandidate, "latitude" | "longitude">, right: Pick<DeviceLocationCandidate, "latitude" | "longitude">) {
  const radius = 6_371_000;
  const toRadians = (value: number) => value * Math.PI / 180;
  const dLat = toRadians(right.latitude - left.latitude);
  const dLon = toRadians(right.longitude - left.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(left.latitude)) * Math.cos(toRadians(right.latitude)) * Math.sin(dLon / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function hasMeaningfulDeviceLocationMove(previous: DeviceLocationCandidate | null | undefined, next: DeviceLocationCandidate) {
  return !previous || deviceLocationDistanceMeters(previous, next) >= DEVICE_LOCATION_MOVE_THRESHOLD_METERS;
}

function isRecent(candidate: DeviceLocationCandidate | null | undefined, now: number) {
  if (!candidate || !isValidDeviceCoordinate(candidate.latitude, candidate.longitude)) return false;
  const timestamp = candidate.resolvedAt ? Date.parse(candidate.resolvedAt) : now;
  return Number.isFinite(timestamp) && now - timestamp >= 0 && now - timestamp <= DEVICE_LOCATION_MAX_AGE_MS;
}

export function resolveDeviceLocation(current: DeviceLocationCandidate | null | undefined, lastKnown: DeviceLocationCandidate | null | undefined, fallback: DeviceLocationCandidate | null | undefined, now = Date.now()): DeviceLocationState {
  if (current && isRecent(current, now)) return { ...current, source: "current", stale: false, resolvedAt: current.resolvedAt ?? new Date(now).toISOString() };
  if (lastKnown && isRecent(lastKnown, now)) return { ...lastKnown, source: "last-known", stale: false, resolvedAt: lastKnown.resolvedAt ?? new Date(now).toISOString() };
  if (fallback && isValidDeviceCoordinate(fallback.latitude, fallback.longitude)) return { ...fallback, source: "fallback", stale: Boolean(lastKnown), resolvedAt: fallback.resolvedAt ?? new Date(now).toISOString() };
  return { source: "unavailable", stale: true };
}

export function locationDisplayLabel(location: Pick<DeviceLocationState, "city" | "region" | "country">) {
  return [location.city, location.region, location.country].filter(Boolean).slice(0, 2).join(", ") || undefined;
}
