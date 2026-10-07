import "server-only";

import { getEnvironment } from "@/engines/environment";
import { getDeveloperKioskCalendarEngine } from "@/services/calendar/accountProvider";
import { fetchKioskCalendarIcalFeeds } from "@/services/kiosk/icalFallback";
import { getDeveloperKioskSchoolData } from "@/services/school/server";
import { isAssignmentActiveForPlanning } from "@/services/school/planning";
import type { CalendarEvent } from "@/core/contracts";
import { KIOSK_REFRESH_MS, sceneRefreshDiagnostics } from "@/services/kiosk/refreshPolicy";
import { readCosmicUpdateStatus } from "@/services/settings/cosmicUpdate";
import { resolveDeviceLocation } from "@/services/kiosk/deviceLocation";
import { classifyWeatherError, type KioskDiagnostics } from "@/services/kiosk/diagnostics";
import { getAuthRepository } from "@/services/auth/repository";
import { isDeveloperKioskSchoolConnected } from "@/services/kiosk/schoolHealth";

const DEFAULT_HOST = "dev.cosmicpudge.shop";
const MAX_EVENTS = 8;
const MAX_ASSIGNMENTS = 8;
const schoolCache = new Map<string, { expiresAt: number; value: Awaited<ReturnType<typeof getDeveloperKioskSchoolData>> }>();

export type KioskProviderDiagnostic = {
  category: "connected" | "provider-not-found" | "account-not-found" | "provider-error" | "parse-error" | "configuration-error" | "authentication-error" | "account-mismatch";
  configured: boolean;
  accountMatched: boolean;
  source?: "account-provider" | "kiosk-ical" | "kiosk-canvas-ical";
  feedCount?: number;
  connectionType?: string;
  accountProviderSucceeded?: boolean;
  canvasIcalConfigured?: boolean;
  canvasIcalAttempted?: boolean;
  canvasIcalSucceeded?: boolean;
};

function providerErrorCategory(error: unknown): KioskProviderDiagnostic["category"] {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /401|403|unauthori[sz]ed|authentication|invalid credential|reconnect/i.test(message) ? "authentication-error" : "provider-error";
}

export function isDeveloperKioskEnabled(): boolean {
  return process.env.COSMIC_KIOSK_ENABLED === "true" || process.env.COSMIC_DEV_KIOSK_ENABLED === "true";
}

export function isDeveloperKioskHost(hostname: string): boolean {
  const host = hostname.split(":")[0].toLowerCase();
  const configuredHost = (process.env.COSMIC_KIOSK_HOSTNAME ?? DEFAULT_HOST).toLowerCase();
  return host === configuredHost || (process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(host));
}

export function isDeveloperKioskRequest(request: Request): boolean {
  if (!isDeveloperKioskEnabled()) return false;
  return isDeveloperKioskHost(new URL(request.url).hostname);
}

function kioskLocation(request?: Request) {
  const params = request ? new URL(request.url).searchParams : null;
  const currentLat = Number(params?.get("kioskLat"));
  const currentLon = Number(params?.get("kioskLon"));
  const currentAt = params?.get("kioskLocationAt") || undefined;
  const locationSource = params?.get("kioskLocationSource");
  const lat = Number(process.env.COSMIC_KIOSK_LAT);
  const lon = Number(process.env.COSMIC_KIOSK_LON);
  const candidate = Number.isFinite(currentLat) && Number.isFinite(currentLon) ? { latitude: currentLat, longitude: currentLon, ...(currentAt ? { resolvedAt: currentAt } : {}) } : null;
  const resolved = resolveDeviceLocation(
    locationSource === "current" ? candidate : null,
    locationSource === "last-known" ? candidate : null,
    Number.isFinite(lat) && Number.isFinite(lon) ? { latitude: lat, longitude: lon, label: process.env.COSMIC_KIOSK_LOCATION_LABEL?.trim() || "Kiosk location" } : null,
  );
  if (resolved.source === "unavailable" || resolved.latitude === undefined || resolved.longitude === undefined) return null;
  return { lat: resolved.latitude, lon: resolved.longitude, label: resolved.city ?? process.env.COSMIC_KIOSK_LOCATION_LABEL?.trim() ?? "Kiosk location", source: resolved.source, stale: resolved.stale };
}

function boundedEvent(event: { id?: string; title?: string; start: Date; end: Date; allDay?: boolean; location?: string; calendar?: string; category?: CalendarEvent["category"] }) {
  return {
    id: String(event.id ?? crypto.randomUUID()).slice(0, 160),
    title: String(event.title ?? "Untitled event").slice(0, 240),
    start: event.start.toISOString(),
    end: event.end.toISOString(),
    allDay: Boolean(event.allDay),
    ...(event.location ? { location: String(event.location).slice(0, 160) } : {}),
    ...(event.calendar ? { calendar: String(event.calendar).slice(0, 100) } : {}),
    ...(event.category ? { category: String(event.category).slice(0, 100) } : {}),
  };
}

export async function getDeveloperKioskData(request?: Request, diagnostics?: KioskDiagnostics) {
  const location = kioskLocation(request);
  const now = new Date();
  const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const result: {
    location: typeof location;
    weather: unknown | null;
    calendar: { events: ReturnType<typeof boundedEvent>[]; connected: boolean; error?: string; diagnostics: KioskProviderDiagnostic };
    school: { assignments: Array<{ id: string; title: string; due: string; course?: string; completed: boolean }>; overdueCount: number; sceneState: "clear" | "upcoming" | "urgent" | "overdue" | "unavailable"; connected: boolean; error?: string; diagnostics: KioskProviderDiagnostic };
    refreshDiagnostics: {
      weather: ReturnType<typeof sceneRefreshDiagnostics>;
      calendar: ReturnType<typeof sceneRefreshDiagnostics>;
      school: ReturnType<typeof sceneRefreshDiagnostics>;
    };
    cosmicUpdate: ReturnType<typeof readCosmicUpdateStatus>;
  } = {
    location,
    weather: null,
    calendar: { events: [], connected: false, diagnostics: { category: "configuration-error", configured: false, accountMatched: false, source: "kiosk-ical", feedCount: 0 } },
    school: { assignments: [], overdueCount: 0, sceneState: "unavailable", connected: false, diagnostics: { category: "account-not-found", configured: false, accountMatched: false, source: "kiosk-canvas-ical" } },
    refreshDiagnostics: {
      weather: sceneRefreshDiagnostics(undefined, KIOSK_REFRESH_MS.weatherCurrent),
      calendar: sceneRefreshDiagnostics(undefined, KIOSK_REFRESH_MS.calendar),
      school: sceneRefreshDiagnostics(undefined, KIOSK_REFRESH_MS.school),
    },
    cosmicUpdate: readCosmicUpdateStatus(now),
  };

  if (diagnostics) {
    const params = request ? new URL(request.url).searchParams : null;
    const locationSource = params?.get("kioskLocationSource");
    const fallbackLat = process.env.COSMIC_KIOSK_LAT?.trim();
    const fallbackLon = process.env.COSMIC_KIOSK_LON?.trim();
    const fallbackConfigured = Boolean(fallbackLat && fallbackLon && Number.isFinite(Number(fallbackLat)) && Number.isFinite(Number(fallbackLon)));
    diagnostics.weather.browserLocationProvided = locationSource === "current";
    diagnostics.weather.storedLocationAvailable = locationSource === "last-known";
    diagnostics.weather.serverFallbackConfigured = fallbackConfigured;
    diagnostics.weather.locationSource = location?.source === "current" ? "browser" : location?.source === "last-known" ? "stored" : location?.source === "fallback" ? "server-fallback" : "unavailable";
    diagnostics.weather.providerAttempted = false;
    diagnostics.weather.providerResult = "unknown";
    diagnostics.school.accountConfigured = Boolean(process.env.COSMIC_KIOSK_ACCOUNT_ID?.trim());
    diagnostics.school.fallbackConfigured = Boolean(process.env.COSMIC_KIOSK_CANVAS_ICAL_URL?.trim());
  }

  if (location) {
    if (diagnostics) diagnostics.weather.providerAttempted = true;
    try {
      result.weather = await getEnvironment(location.lat, location.lon);
      if (location.label === "Kiosk location" && result.weather && typeof result.weather === "object" && "city" in result.weather && typeof result.weather.city === "string") location.label = result.weather.city;
      result.refreshDiagnostics.weather = sceneRefreshDiagnostics(new Date().toISOString(), KIOSK_REFRESH_MS.weatherCurrent);
      if (diagnostics) diagnostics.weather.providerResult = "ok";
    }
    catch (error) {
      if (diagnostics) Object.assign(diagnostics.weather, classifyWeatherError(error));
    }
  }

  try {
    const accountId = process.env.COSMIC_KIOSK_ACCOUNT_ID?.trim();
    let engineResult: Awaited<ReturnType<typeof getDeveloperKioskCalendarEngine>> = null;
    try { engineResult = await getDeveloperKioskCalendarEngine(accountId); } catch { /* The kiosk iCal feeds are the bounded fallback. */ }
    const engine = engineResult?.engine;
    if (engine && engineResult) {
      const events = await engine.getEvents({ start: now, end });
      result.calendar = { connected: true, events: events.slice(0, MAX_EVENTS).map((event) => boundedEvent(event)), diagnostics: { category: "connected", configured: true, accountMatched: Boolean(accountId), source: "account-provider", feedCount: 0, ...(engineResult.context?.connection?.providerType ? { connectionType: engineResult.context.connection.providerType } : {}) } };
      result.refreshDiagnostics.calendar = sceneRefreshDiagnostics(new Date().toISOString(), KIOSK_REFRESH_MS.calendar);
    } else {
      throw new Error("Account calendar unavailable.");
    }
  } catch {
    const urls = [process.env.COSMIC_KIOSK_ICAL_URL_1, process.env.COSMIC_KIOSK_ICAL_URL_2].map((value) => value?.trim()).filter((value): value is string => Boolean(value));
    if (!urls.length) {
      result.calendar = { connected: false, events: [], error: "Calendar is not configured.", diagnostics: { category: "configuration-error", configured: false, accountMatched: Boolean(process.env.COSMIC_KIOSK_ACCOUNT_ID?.trim()), source: "kiosk-ical", feedCount: 0 } };
    } else {
      const fallback = await fetchKioskCalendarIcalFeeds(urls);
      const visibleEvents = fallback.events.filter((event) => event.end > now && event.start < end).slice(0, MAX_EVENTS).map((event) => boundedEvent(event));
      result.calendar = { connected: fallback.feedCount > 0, events: visibleEvents, ...(fallback.feedCount ? {} : { error: "Calendar feeds are temporarily unavailable." }), diagnostics: { category: fallback.feedCount ? "connected" : fallback.category, configured: true, accountMatched: Boolean(process.env.COSMIC_KIOSK_ACCOUNT_ID?.trim()), source: "kiosk-ical", feedCount: fallback.feedCount } };
      if (fallback.feedCount > 0) result.refreshDiagnostics.calendar = sceneRefreshDiagnostics(new Date().toISOString(), KIOSK_REFRESH_MS.calendar);
    }
  }

  const accountId = process.env.COSMIC_KIOSK_ACCOUNT_ID?.trim();
  if (accountId) {
    try {
      const cachedSchool = schoolCache.get(accountId);
      const school = cachedSchool && cachedSchool.expiresAt > Date.now()
        ? cachedSchool.value
        : await getDeveloperKioskSchoolData(accountId);
      if (!cachedSchool || cachedSchool.expiresAt <= Date.now()) {
        schoolCache.set(accountId, { value: school, expiresAt: Date.now() + KIOSK_REFRESH_MS.school });
      }
      const schoolUsesIcal = school.kioskSource === "kiosk-canvas-ical";
      const assignments = (school.snapshot.planningAssignments ?? []).filter((item) => isAssignmentActiveForPlanning(item) && (!schoolUsesIcal || (item.dueAt && item.dueAt >= now)));
      const upcoming = assignments.filter((item) => item.dueAt && item.completionStatus !== "completed").sort((a, b) => a.dueAt!.getTime() - b.dueAt!.getTime());
      const overdueCount = schoolUsesIcal ? 0 : upcoming.filter((item) => item.dueAt! < now).length;
      const urgentHours = Math.max(1, Number(process.env.COSMIC_KIOSK_SCHOOL_URGENT_HOURS ?? 24));
      const nextDue = upcoming[0]?.dueAt;
      const connected = isDeveloperKioskSchoolConnected(school);
      result.school = {
        connected,
        assignments: upcoming.slice(0, MAX_ASSIGNMENTS).map((item) => ({ id: item.id.slice(0, 160), title: item.title.slice(0, 240), due: item.dueAt!.toISOString(), ...(item.courseName ? { course: item.courseName.slice(0, 120) } : {}), completed: item.completionStatus === "completed" })),
        overdueCount,
        sceneState: overdueCount > 0 ? "overdue" : nextDue ? (nextDue.getTime() - now.getTime() <= urgentHours * 60 * 60 * 1000 ? "urgent" : "upcoming") : "clear",
        ...(school.error ? { error: "School data temporarily unavailable." } : {}),
        diagnostics: { category: school.errorCategory ?? (connected ? "connected" : "provider-not-found"), configured: true, accountMatched: true, source: school.kioskSource ?? "account-provider", ...(connected ? { connectionType: "canvas-rest-or-calendar" } : {}), accountProviderSucceeded: school.accountProviderSucceeded ?? false, canvasIcalConfigured: school.canvasIcalConfigured ?? false, canvasIcalAttempted: school.canvasIcalAttempted ?? false, canvasIcalSucceeded: school.canvasIcalSucceeded ?? false },
      };
      if (diagnostics) {
        diagnostics.school.accountLookupAttempted = true;
        diagnostics.school.provider = school.kioskSource === "kiosk-canvas-ical" ? "ical" : school.accountProviderSucceeded || school.snapshot.sourceStatus?.canvas !== "not_connected" || school.credentialAvailable ? "canvas" : "none";
        diagnostics.school.providerConfigured = Boolean(school.accountProviderSucceeded || school.canvasIcalConfigured || school.snapshot.sourceStatus?.canvas !== "not_connected" || school.credentialAvailable);
        diagnostics.school.credentialAvailable = Boolean(school.credentialAvailable);
        diagnostics.school.providerAttempted = true;
        diagnostics.school.providerResult = connected ? "ok" : school.errorCategory === "authentication-error" ? "auth-error" : school.errorCategory === "configuration-error" && !school.credentialAvailable ? "credential-error" : diagnostics.school.providerConfigured ? "provider-error" : "no-source";
        diagnostics.school.aggregateConfigured = true;
        diagnostics.school.aggregateHasData = Boolean(upcoming.length || connected);
      }
      if (connected) result.refreshDiagnostics.school = sceneRefreshDiagnostics(new Date().toISOString(), KIOSK_REFRESH_MS.school);
    } catch (error) {
      result.school = { assignments: [], overdueCount: 0, sceneState: "unavailable", connected: false, error: "School data temporarily unavailable.", diagnostics: { category: providerErrorCategory(error), configured: true, accountMatched: true, source: "account-provider" } };
      if (diagnostics) {
        diagnostics.school.accountLookupAttempted = true;
        diagnostics.school.provider = "canvas";
        diagnostics.school.providerConfigured = true;
        diagnostics.school.providerAttempted = true;
        diagnostics.school.providerResult = providerErrorCategory(error) === "authentication-error" ? "auth-error" : "provider-error";
        diagnostics.school.aggregateConfigured = true;
      }
    }
  }

  if (diagnostics) {
    if (accountId) {
      try {
        diagnostics.school.accountMatched = Boolean(await getAuthRepository().findUserById(accountId));
      } catch {
        diagnostics.school.accountMatched = false;
      }
    }
    if (!accountId) {
      diagnostics.school.provider = "none";
      diagnostics.school.providerResult = "account-not-found";
    }
    diagnostics.weather.aggregateHasWeather = result.weather !== null;
    diagnostics.school.aggregateHasData = Boolean(result.school.assignments.length || result.school.connected);
  }

  return result;
}

class KioskDiagnosticsTimeout extends Error {
  category = "timeout" as const;
}

function withKioskDiagnosticsTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new KioskDiagnosticsTimeout()), timeoutMs);
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

type KioskDiagnosticsStage = (stage: "start" | "auth=ok" | "response=ready" | "account-lookup=start" | "account-lookup=done" | "account-lookup=failed" | "weather=start" | "weather=done" | "weather=failed" | "weather=timeout" | "school=start" | "school=done" | "school=failed" | "school=timeout") => void;

export async function getDeveloperKioskDiagnostics(request: Request, diagnostics: KioskDiagnostics, stage: KioskDiagnosticsStage) {
  const location = kioskLocation(request);
  const params = new URL(request.url).searchParams;
  const locationSource = params.get("kioskLocationSource");
  const fallbackLat = process.env.COSMIC_KIOSK_LAT?.trim();
  const fallbackLon = process.env.COSMIC_KIOSK_LON?.trim();
  const fallbackConfigured = Boolean(fallbackLat && fallbackLon && Number.isFinite(Number(fallbackLat)) && Number.isFinite(Number(fallbackLon)));
  diagnostics.weather.browserLocationProvided = locationSource === "current";
  diagnostics.weather.storedLocationAvailable = locationSource === "last-known";
  diagnostics.weather.serverFallbackConfigured = fallbackConfigured;
  diagnostics.weather.locationSource = location?.source === "current" ? "browser" : location?.source === "last-known" ? "stored" : location?.source === "fallback" ? "server-fallback" : "unavailable";
  diagnostics.school.accountConfigured = Boolean(process.env.COSMIC_KIOSK_ACCOUNT_ID?.trim());
  diagnostics.school.fallbackConfigured = Boolean(process.env.COSMIC_KIOSK_CANVAS_ICAL_URL?.trim());

  const accountId = process.env.COSMIC_KIOSK_ACCOUNT_ID?.trim();
  stage("weather=start");
  stage("school=start");
  stage("account-lookup=start");
  const weatherPromise = location
    ? withKioskDiagnosticsTimeout(getEnvironment(location.lat, location.lon), 10_000)
    : Promise.resolve(null);
  const schoolPromise = accountId
    ? withKioskDiagnosticsTimeout(getDeveloperKioskSchoolData(accountId), 10_000)
    : Promise.resolve(null);
  const accountPromise = accountId
    ? withKioskDiagnosticsTimeout(getAuthRepository().findUserById(accountId), 5_000)
    : Promise.resolve(null);
  const [weatherResult, schoolResult, accountResult] = await Promise.allSettled([weatherPromise, schoolPromise, accountPromise]);

  diagnostics.weather.providerAttempted = Boolean(location);
  if (!location) {
    diagnostics.weather.providerResult = "configuration-error";
  } else if (weatherResult.status === "fulfilled") {
    diagnostics.weather.providerResult = weatherResult.value ? "ok" : "unknown";
    diagnostics.weather.aggregateHasWeather = Boolean(weatherResult.value);
    stage("weather=done");
  } else if (weatherResult.reason instanceof KioskDiagnosticsTimeout || (weatherResult.reason as { category?: string } | null)?.category === "timeout") {
    diagnostics.weather.providerResult = "timeout";
    stage("weather=timeout");
  } else {
    Object.assign(diagnostics.weather, classifyWeatherError(weatherResult.reason));
    stage("weather=failed");
  }

  diagnostics.school.accountLookupAttempted = Boolean(accountId);
  if (accountResult.status === "fulfilled") {
    diagnostics.school.accountMatched = Boolean(accountResult.value);
    stage(accountResult.value ? "account-lookup=done" : "account-lookup=failed");
  } else {
    diagnostics.school.accountMatched = false;
    stage("account-lookup=failed");
  }
  if (!accountId) {
    diagnostics.school.provider = "none";
    diagnostics.school.providerResult = "account-not-found";
    return;
  }

  diagnostics.school.providerAttempted = true;
  diagnostics.school.aggregateConfigured = true;
  if (schoolResult.status === "fulfilled" && schoolResult.value) {
    const school = schoolResult.value;
    const connected = isDeveloperKioskSchoolConnected(school);
    diagnostics.school.provider = school.kioskSource === "kiosk-canvas-ical" ? "ical" : "canvas";
    diagnostics.school.providerConfigured = true;
    diagnostics.school.credentialAvailable = Boolean(school.credentialAvailable);
    diagnostics.school.providerResult = connected ? "ok" : school.errorCategory === "authentication-error" ? "auth-error" : school.errorCategory === "configuration-error" && !school.credentialAvailable ? "credential-error" : "provider-error";
    diagnostics.school.aggregateHasData = Boolean(school.snapshot.planningAssignments?.length || connected);
    stage("school=done");
  } else if (schoolResult.status === "rejected" && (schoolResult.reason instanceof KioskDiagnosticsTimeout || (schoolResult.reason as { category?: string } | null)?.category === "timeout")) {
    diagnostics.school.provider = "canvas";
    diagnostics.school.providerConfigured = true;
    diagnostics.school.providerAttempted = true;
    diagnostics.school.providerResult = "timeout";
    stage("school=timeout");
  } else {
    diagnostics.school.provider = "canvas";
    diagnostics.school.providerConfigured = true;
    diagnostics.school.providerAttempted = true;
    diagnostics.school.providerResult = "provider-error";
    stage("school=failed");
  }
}
