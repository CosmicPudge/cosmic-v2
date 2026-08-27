import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import type { KioskDeviceProfile, KioskDisplayProfile, KioskLocationMode, KioskLocationSource, KioskSetupPreview } from "@/core/contracts/Kiosk";
import { getDatabase, isDatabaseConfigured } from "@/services/database/client";
import { devices, kioskDeviceSettings, phoneLocations } from "@/services/database/schema";
import { isFreshKioskPhoneLocation, TEMPORARY_KIOSK_LOCATION } from "@/services/kioskLocation";

export interface KioskProfileInput {
  setupCompleted?: boolean;
  setupVersion?: number;
  uiScale?: number;
  deviceName?: string;
  setupPreview?: KioskSetupPreview;
  nightDimPreview?: boolean;
  display?: Partial<KioskDisplayProfile>;
  timezone?: string;
  reportedTimezone?: string;
  timezoneOverride?: string | null;
  clockFormat?: "12h" | "24h";
  locationMode?: KioskLocationMode;
  location?: { latitude: number; longitude: number; label?: string; region?: string; country?: string; timezone?: string; source: KioskLocationSource } | null;
  reportedLocation?: { latitude: number; longitude: number; label?: string; region?: string; country?: string; timezone?: string; source: "detected" };
  nightDimEnabled?: boolean;
  nightDimStart?: string;
  nightDimEnd?: string;
  nightDimOpacity?: number;
}

function requireDatabase() {
  if (!isDatabaseConfigured()) throw new Error("Kiosk setup requires durable PostgreSQL storage.");
  return getDatabase();
}

export function isValidKioskTimezone(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try { new Intl.DateTimeFormat("en-US", { timeZone: value }).format(); return true; } catch { return false; }
}

export async function reverseGeocode(latitude: number, longitude: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2"); url.searchParams.set("zoom", "10"); url.searchParams.set("addressdetails", "1");
    url.searchParams.set("lat", String(latitude)); url.searchParams.set("lon", String(longitude));
    const response = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "Cosmic OS kiosk setup" }, cache: "no-store" });
    if (!response.ok) return null;
    const body = await response.json() as { address?: { city?: string; town?: string; village?: string; municipality?: string; state?: string; country?: string } };
    const address = body.address;
    if (!address) return null;
    const city = address.city ?? address.town ?? address.village ?? address.municipality;
    const label = [city, address.state, address.country].filter(Boolean).join(", ") || undefined;
    return { label, region: address.state, country: address.country };
  } catch { return null; } finally { clearTimeout(timeout); }
}

export async function assertDeviceOwner(deviceId: string, userId: string) {
  const [device] = await requireDatabase().select({ id: devices.id }).from(devices).where(and(eq(devices.id, deviceId), eq(devices.userId, userId), isNull(devices.revokedAt))).limit(1);
  return Boolean(device);
}

export async function readKioskDeviceProfile(deviceId: string): Promise<KioskDeviceProfile | null> {
  const database = requireDatabase();
  const [row] = await database.select().from(kioskDeviceSettings).where(eq(kioskDeviceSettings.deviceId, deviceId)).limit(1);
  if (!row) return null;
  const [device] = await database.select({ name: devices.name, publicNumber: devices.publicNumber, userId: devices.userId }).from(devices).where(eq(devices.id, deviceId)).limit(1);
  const [phoneLocation] = device?.userId ? await database.select().from(phoneLocations).where(eq(phoneLocations.userId, device.userId)).limit(1) : [];
  const hasLocation = typeof row.locationLatitude === "number" && typeof row.locationLongitude === "number" && row.locationSource;
  const hasReportedLocation = typeof row.reportedLocationLatitude === "number" && typeof row.reportedLocationLongitude === "number";
  const reportedTimezone = isValidKioskTimezone(row.reportedTimezone) ? row.reportedTimezone : undefined;
  const timezoneOverride = isValidKioskTimezone(row.timezoneOverride) ? row.timezoneOverride : isValidKioskTimezone(row.timezone) ? row.timezone : undefined;
  const effectiveTimezone = timezoneOverride ?? reportedTimezone ?? (isValidKioskTimezone(row.locationTimezone) ? row.locationTimezone : undefined) ?? TEMPORARY_KIOSK_LOCATION.timezone;
  const locationMode: KioskLocationMode = row.locationMode === "fixed" || row.locationMode === "follow-phone" ? row.locationMode : "account";
  const configuredLocation = hasLocation ? { latitude: row.locationLatitude!, longitude: row.locationLongitude!, ...(row.locationLabel ? { label: row.locationLabel } : {}), ...(row.locationRegion ? { region: row.locationRegion } : {}), ...(row.locationCountry ? { country: row.locationCountry } : {}), ...(row.locationTimezone ? { timezone: row.locationTimezone } : {}), source: row.locationSource === "account" ? "account" as const : "device" as const } : null;
  const reportedLocation = hasReportedLocation ? { latitude: row.reportedLocationLatitude!, longitude: row.reportedLocationLongitude!, ...(row.reportedLocationLabel ? { label: row.reportedLocationLabel } : {}), ...(row.reportedLocationRegion ? { region: row.reportedLocationRegion } : {}), ...(row.reportedLocationCountry ? { country: row.reportedLocationCountry } : {}), ...(row.reportedLocationTimezone ? { timezone: row.reportedLocationTimezone } : {}) } : null;
  const freshPhone = phoneLocation && isFreshKioskPhoneLocation(phoneLocation.reportedAt) ? phoneLocation : null;
  const stalePhone = phoneLocation && !freshPhone ? phoneLocation : null;
  const effectiveBase = locationMode === "follow-phone" ? freshPhone ?? configuredLocation ?? reportedLocation ?? (phoneLocation ?? null) : configuredLocation ?? (locationMode === "account" ? reportedLocation : null);
  const effectiveLocation = effectiveBase ? {
    latitude: effectiveBase.latitude,
    longitude: effectiveBase.longitude,
    ...(effectiveBase.label ? { label: effectiveBase.label } : {}),
    ...(effectiveBase.region ? { region: effectiveBase.region } : {}),
    ...(effectiveBase.country ? { country: effectiveBase.country } : {}),
    ...(effectiveBase.timezone ? { timezone: effectiveBase.timezone } : {}),
    source: effectiveBase === freshPhone ? "phone" as const : effectiveBase === configuredLocation ? configuredLocation.source : effectiveBase === reportedLocation ? "device" as const : "phone" as const,
    ...(effectiveBase === freshPhone || effectiveBase === stalePhone ? { reportedAt: phoneLocation!.reportedAt.toISOString(), ...(effectiveBase === stalePhone ? { stale: true } : {}) } : {}),
  } : { ...TEMPORARY_KIOSK_LOCATION, source: "kiosk-fallback" as const };
  return {
    deviceId,
    ...(device?.publicNumber ? { deviceNumber: device.publicNumber } : {}),
    ...(device?.name ? { deviceName: device.name } : {}),
    locationMode,
    setupCompleted: row.setupCompleted,
    setupVersion: row.setupVersion,
    uiScale: row.uiScale,
    setupPreview: row.setupPreview as KioskSetupPreview,
    nightDimPreview: row.nightDimPreview,
    ...(row.viewportWidth && row.viewportHeight && row.devicePixelRatio && row.aspectRatio && row.orientation && row.density && row.pointer ? {
      display: {
        viewportWidth: row.viewportWidth, viewportHeight: row.viewportHeight, clientWidth: row.viewportWidth, clientHeight: row.viewportHeight,
        ...(row.physicalScreenWidth ? { physicalScreenWidth: row.physicalScreenWidth } : {}), ...(row.physicalScreenHeight ? { physicalScreenHeight: row.physicalScreenHeight } : {}),
        devicePixelRatio: row.devicePixelRatio, aspectRatio: row.aspectRatio, orientation: row.orientation as KioskDisplayProfile["orientation"], density: row.density as KioskDisplayProfile["density"], touch: Boolean(row.touchDetected), pointer: row.pointer as KioskDisplayProfile["pointer"], overflowX: 0, overflowY: 0, setupVersion: row.setupVersion,
        ...(reportedTimezone ? { timezone: reportedTimezone } : {}),
      },
    } : {}),
    ...(effectiveTimezone ? { timezone: effectiveTimezone, effectiveTimezone } : {}),
    ...(reportedTimezone ? { reportedTimezone } : {}),
    ...(timezoneOverride ? { timezoneOverride } : {}),
    ...(row.clockFormat ? { clockFormat: row.clockFormat as "12h" | "24h" } : {}),
    ...(hasLocation ? { location: { latitude: row.locationLatitude!, longitude: row.locationLongitude!, ...(row.locationLabel ? { label: row.locationLabel } : {}), ...(row.locationRegion ? { region: row.locationRegion } : {}), ...(row.locationCountry ? { country: row.locationCountry } : {}), ...(row.locationTimezone ? { timezone: row.locationTimezone } : {}), source: row.locationSource as KioskLocationSource } } : {}),
    effectiveLocation,
    ...(hasReportedLocation ? { reportedLocation: { latitude: row.reportedLocationLatitude!, longitude: row.reportedLocationLongitude!, ...(row.reportedLocationLabel ? { label: row.reportedLocationLabel } : {}), ...(row.reportedLocationRegion ? { region: row.reportedLocationRegion } : {}), ...(row.reportedLocationCountry ? { country: row.reportedLocationCountry } : {}), ...(row.reportedLocationTimezone ? { timezone: row.reportedLocationTimezone } : {}), source: "detected" as const } } : {}),
    nightDimEnabled: row.nightDimEnabled,
    nightDimStart: row.nightDimStart,
    nightDimEnd: row.nightDimEnd,
    nightDimOpacity: row.nightDimOpacity,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function displayValues(display: Partial<KioskDisplayProfile> | undefined) {
  if (!display) return {};
  return {
    ...(typeof display.viewportWidth === "number" ? { viewportWidth: Math.round(display.viewportWidth) } : {}),
    ...(typeof display.viewportHeight === "number" ? { viewportHeight: Math.round(display.viewportHeight) } : {}),
    ...(typeof display.physicalScreenWidth === "number" ? { physicalScreenWidth: Math.round(display.physicalScreenWidth) } : {}),
    ...(typeof display.physicalScreenHeight === "number" ? { physicalScreenHeight: Math.round(display.physicalScreenHeight) } : {}),
    ...(typeof display.devicePixelRatio === "number" ? { devicePixelRatio: display.devicePixelRatio } : {}),
    ...(typeof display.aspectRatio === "number" ? { aspectRatio: display.aspectRatio } : {}),
    ...(display.orientation ? { orientation: display.orientation } : {}),
    ...(display.density ? { density: display.density } : {}),
    ...(typeof display.touch === "boolean" ? { touchDetected: display.touch } : {}),
    ...(display.pointer ? { pointer: display.pointer } : {}),
  };
}

export async function saveKioskDeviceProfile(deviceId: string, input: KioskProfileInput) {
  const database = requireDatabase();
  const now = new Date();
  const previous = await database.select({ latitude: kioskDeviceSettings.locationLatitude, longitude: kioskDeviceSettings.locationLongitude, reportedLatitude: kioskDeviceSettings.reportedLocationLatitude, reportedLongitude: kioskDeviceSettings.reportedLocationLongitude }).from(kioskDeviceSettings).where(eq(kioskDeviceSettings.deviceId, deviceId)).limit(1);
  const locationChanged = Boolean(input.location && (!previous[0] || Math.abs((previous[0].latitude ?? 0) - input.location.latitude) > 0.0001 || Math.abs((previous[0].longitude ?? 0) - input.location.longitude) > 0.0001));
  const resolved = input.location && locationChanged ? await reverseGeocode(input.location.latitude, input.location.longitude) : null;
  const reportedChanged = Boolean(input.reportedLocation && (!previous[0] || Math.abs((previous[0].reportedLatitude ?? 0) - input.reportedLocation.latitude) > 0.0001 || Math.abs((previous[0].reportedLongitude ?? 0) - input.reportedLocation.longitude) > 0.0001));
  const resolvedReported = input.reportedLocation && reportedChanged ? await reverseGeocode(input.reportedLocation.latitude, input.reportedLocation.longitude) : null;
  const location = input.location === null ? { locationLatitude: null, locationLongitude: null, locationLabel: null, locationRegion: null, locationCountry: null, locationTimezone: null, locationSource: null } : input.location ? { locationLatitude: input.location.latitude, locationLongitude: input.location.longitude, locationLabel: input.location.label ?? resolved?.label ?? null, locationRegion: input.location.region ?? resolved?.region ?? null, locationCountry: input.location.country ?? resolved?.country ?? null, locationTimezone: input.location.timezone ?? null, locationSource: input.location.source } : {};
  const reportedLocation = input.reportedLocation ? { reportedLocationLatitude: input.reportedLocation.latitude, reportedLocationLongitude: input.reportedLocation.longitude, reportedLocationLabel: input.reportedLocation.label ?? resolvedReported?.label ?? null, reportedLocationRegion: input.reportedLocation.region ?? resolvedReported?.region ?? null, reportedLocationCountry: input.reportedLocation.country ?? resolvedReported?.country ?? null, reportedLocationTimezone: input.reportedLocation.timezone ?? null } : {};
  const reportedTimezone = isValidKioskTimezone(input.reportedTimezone) ? input.reportedTimezone : undefined;
  const timezoneOverride = input.timezoneOverride === null ? { timezoneOverride: null } : isValidKioskTimezone(input.timezoneOverride ?? input.timezone) ? { timezoneOverride: input.timezoneOverride ?? input.timezone } : {};
  const locationMode = input.locationMode === "fixed" || input.locationMode === "follow-phone" || input.locationMode === "account" ? { locationMode: input.locationMode } : {};
  const values = { deviceId, ...locationMode, ...(typeof input.setupCompleted === "boolean" ? { setupCompleted: input.setupCompleted } : {}), ...(typeof input.setupVersion === "number" ? { setupVersion: input.setupVersion } : {}), ...(typeof input.uiScale === "number" ? { uiScale: input.uiScale } : {}), ...(input.setupPreview ? { setupPreview: input.setupPreview } : {}), ...(typeof input.nightDimPreview === "boolean" ? { nightDimPreview: input.nightDimPreview } : {}), ...displayValues(input.display), ...(reportedTimezone ? { reportedTimezone } : {}), ...timezoneOverride, ...(input.clockFormat ? { clockFormat: input.clockFormat } : {}), ...location, ...reportedLocation, ...(typeof input.nightDimEnabled === "boolean" ? { nightDimEnabled: input.nightDimEnabled } : {}), ...(input.nightDimStart ? { nightDimStart: input.nightDimStart } : {}), ...(input.nightDimEnd ? { nightDimEnd: input.nightDimEnd } : {}), ...(typeof input.nightDimOpacity === "number" ? { nightDimOpacity: input.nightDimOpacity } : {}), updatedAt: now };
  const updates = { ...locationMode, ...(typeof input.setupCompleted === "boolean" ? { setupCompleted: input.setupCompleted } : {}), ...(typeof input.setupVersion === "number" ? { setupVersion: input.setupVersion } : {}), ...(typeof input.uiScale === "number" ? { uiScale: input.uiScale } : {}), ...(input.setupPreview ? { setupPreview: input.setupPreview } : {}), ...(typeof input.nightDimPreview === "boolean" ? { nightDimPreview: input.nightDimPreview } : {}), ...displayValues(input.display), ...(reportedTimezone ? { reportedTimezone } : {}), ...timezoneOverride, ...(input.clockFormat ? { clockFormat: input.clockFormat } : {}), ...location, ...reportedLocation, ...(typeof input.nightDimEnabled === "boolean" ? { nightDimEnabled: input.nightDimEnabled } : {}), ...(input.nightDimStart ? { nightDimStart: input.nightDimStart } : {}), ...(input.nightDimEnd ? { nightDimEnd: input.nightDimEnd } : {}), ...(typeof input.nightDimOpacity === "number" ? { nightDimOpacity: input.nightDimOpacity } : {}), updatedAt: now };
  await database.insert(kioskDeviceSettings).values(values).onConflictDoUpdate({ target: kioskDeviceSettings.deviceId, set: updates });
  if (input.deviceName?.trim()) await database.update(devices).set({ name: input.deviceName.trim(), lastSeenAt: now }).where(eq(devices.id, deviceId));
  const profile = await readKioskDeviceProfile(deviceId);
  if (!profile) throw new Error("Kiosk profile was not available after save.");
  return profile;
}
