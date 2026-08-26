import "server-only";

import { and, eq, isNull } from "drizzle-orm";
import type { KioskDeviceProfile, KioskDisplayProfile, KioskLocationSource, KioskSetupPreview } from "@/core/contracts/Kiosk";
import { getDatabase, isDatabaseConfigured } from "@/services/database/client";
import { devices, kioskDeviceSettings } from "@/services/database/schema";

export interface KioskProfileInput {
  setupCompleted?: boolean;
  setupVersion?: number;
  uiScale?: number;
  deviceName?: string;
  setupPreview?: KioskSetupPreview;
  nightDimPreview?: boolean;
  display?: Partial<KioskDisplayProfile>;
  timezone?: string;
  clockFormat?: "12h" | "24h";
  location?: { latitude: number; longitude: number; label?: string; source: KioskLocationSource } | null;
  nightDimEnabled?: boolean;
  nightDimStart?: string;
  nightDimEnd?: string;
  nightDimOpacity?: number;
}

function requireDatabase() {
  if (!isDatabaseConfigured()) throw new Error("Kiosk setup requires durable PostgreSQL storage.");
  return getDatabase();
}

export async function assertDeviceOwner(deviceId: string, userId: string) {
  const [device] = await requireDatabase().select({ id: devices.id }).from(devices).where(and(eq(devices.id, deviceId), eq(devices.userId, userId), isNull(devices.revokedAt))).limit(1);
  return Boolean(device);
}

export async function readKioskDeviceProfile(deviceId: string): Promise<KioskDeviceProfile | null> {
  const database = requireDatabase();
  const [row] = await database.select().from(kioskDeviceSettings).where(eq(kioskDeviceSettings.deviceId, deviceId)).limit(1);
  if (!row) return null;
  const [device] = await database.select({ name: devices.name }).from(devices).where(eq(devices.id, deviceId)).limit(1);
  const hasLocation = typeof row.locationLatitude === "number" && typeof row.locationLongitude === "number" && row.locationSource;
  return {
    deviceId,
    ...(device?.name ? { deviceName: device.name } : {}),
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
      },
    } : {}),
    ...(row.timezone ? { timezone: row.timezone } : {}),
    ...(row.clockFormat ? { clockFormat: row.clockFormat as "12h" | "24h" } : {}),
    ...(hasLocation ? { location: { latitude: row.locationLatitude!, longitude: row.locationLongitude!, ...(row.locationLabel ? { label: row.locationLabel } : {}), source: row.locationSource as KioskLocationSource } } : {}),
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
  const location = input.location === null ? { locationLatitude: null, locationLongitude: null, locationLabel: null, locationSource: null } : input.location ? { locationLatitude: input.location.latitude, locationLongitude: input.location.longitude, locationLabel: input.location.label ?? null, locationSource: input.location.source } : {};
  await database.insert(kioskDeviceSettings).values({ deviceId, ...(typeof input.setupCompleted === "boolean" ? { setupCompleted: input.setupCompleted } : {}), ...(typeof input.setupVersion === "number" ? { setupVersion: input.setupVersion } : {}), ...(typeof input.uiScale === "number" ? { uiScale: input.uiScale } : {}), ...(input.setupPreview ? { setupPreview: input.setupPreview } : {}), ...(typeof input.nightDimPreview === "boolean" ? { nightDimPreview: input.nightDimPreview } : {}), ...displayValues(input.display), ...(input.timezone ? { timezone: input.timezone } : {}), ...(input.clockFormat ? { clockFormat: input.clockFormat } : {}), ...location, ...(typeof input.nightDimEnabled === "boolean" ? { nightDimEnabled: input.nightDimEnabled } : {}), ...(input.nightDimStart ? { nightDimStart: input.nightDimStart } : {}), ...(input.nightDimEnd ? { nightDimEnd: input.nightDimEnd } : {}), ...(typeof input.nightDimOpacity === "number" ? { nightDimOpacity: input.nightDimOpacity } : {}), updatedAt: now }).onConflictDoUpdate({ target: kioskDeviceSettings.deviceId, set: { ...(typeof input.setupCompleted === "boolean" ? { setupCompleted: input.setupCompleted } : {}), ...(typeof input.setupVersion === "number" ? { setupVersion: input.setupVersion } : {}), ...(typeof input.uiScale === "number" ? { uiScale: input.uiScale } : {}), ...(input.setupPreview ? { setupPreview: input.setupPreview } : {}), ...(typeof input.nightDimPreview === "boolean" ? { nightDimPreview: input.nightDimPreview } : {}), ...displayValues(input.display), ...(input.timezone ? { timezone: input.timezone } : {}), ...(input.clockFormat ? { clockFormat: input.clockFormat } : {}), ...location, ...(typeof input.nightDimEnabled === "boolean" ? { nightDimEnabled: input.nightDimEnabled } : {}), ...(input.nightDimStart ? { nightDimStart: input.nightDimStart } : {}), ...(input.nightDimEnd ? { nightDimEnd: input.nightDimEnd } : {}), ...(typeof input.nightDimOpacity === "number" ? { nightDimOpacity: input.nightDimOpacity } : {}), updatedAt: now } });
  if (input.deviceName?.trim()) await database.update(devices).set({ name: input.deviceName.trim(), lastSeenAt: now }).where(eq(devices.id, deviceId));
  const profile = await readKioskDeviceProfile(deviceId);
  if (!profile) throw new Error("Kiosk profile was not available after save.");
  return profile;
}
