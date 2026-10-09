import "server-only";

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
import { readCloudSnapshot } from "@/services/sync/repository";
import type { GarageLocalData } from "@/core/contracts/Garage";
import type { NotesLocalData } from "@/core/contracts/Notes";
import type { ProjectsLocalData } from "@/core/contracts/Projects";

const DEFAULT_HOST = "dev.cosmicpudge.shop";
const MAX_EVENTS = 24;
const MAX_ASSIGNMENTS = 64;
const KIOSK_DATA_PROVIDER_TIMEOUT_MS = 10_000;
const schoolCache = new Map<string, { expiresAt: number; value: Awaited<ReturnType<typeof getDeveloperKioskSchoolData>> }>();

class KioskDataProviderTimeout extends Error {
  category = "timeout" as const;
}

function withKioskDataProviderTimeout<T>(promise: Promise<T>, timeoutMs = KIOSK_DATA_PROVIDER_TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new KioskDataProviderTimeout()), timeoutMs);
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

function traceKioskCalendar(stage: "fetch=start" | "fetch=ok" | "fetch=failed" | "parse=ok" | "aggregate=present" | "aggregate=missing" | "health=connected" | "health=reconnecting" | "health=stale" | "health=disconnected" | "scene=loading" | "scene=ready" | "scene=empty" | "scene=error", category?: string) {
  if (process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview") console.info(`[kiosk-calendar] ${stage}${category ? ` category=${category}` : ""}`);
}

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
  return process.env.NODE_ENV !== "production" || process.env.COSMIC_KIOSK_ENABLED === "true" || process.env.COSMIC_DEV_KIOSK_ENABLED === "true";
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

function boundedEvent(event: { id?: string; title?: string; start: Date; end: Date; allDay?: boolean; location?: string; calendar?: string; calendarName?: string; category?: CalendarEvent["category"] }) {
  return {
    id: String(event.id ?? crypto.randomUUID()).slice(0, 160),
    title: String(event.title ?? "Untitled event").slice(0, 240),
    start: event.start.toISOString(),
    end: event.end.toISOString(),
    allDay: Boolean(event.allDay),
    ...(event.location ? { location: String(event.location).slice(0, 160) } : {}),
    ...((event.calendarName ?? event.calendar) ? { calendar: String(event.calendarName ?? event.calendar).slice(0, 100) } : {}),
    ...(event.category ? { category: String(event.category).slice(0, 100) } : {}),
  };
}

function looksLikeAssignmentDeadline(name: string, start: Date, end: Date) {
  const durationMs = Math.abs(end.getTime() - start.getTime());
  const midnight = start.getHours() === 0 && start.getMinutes() === 0 && end.getHours() === 0 && end.getMinutes() === 0;
  const deadlineWords = /assignment|journal|response|essay|draft|report|quiz|exam|test|homework|rpf|rfp|lesson|module|discussion|due/i.test(name);
  return durationMs === 0 || (midnight && deadlineWords);
}

export async function getDeveloperKioskData(request?: Request, diagnostics?: KioskDiagnostics, authenticatedAccountId?: string) {
  const location = kioskLocation(request);
  const now = new Date();
  const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const accountId = authenticatedAccountId ?? process.env.COSMIC_KIOSK_ACCOUNT_ID?.trim();
  const result: {
    location: typeof location;
    weather: unknown | null;
    calendar: { events: ReturnType<typeof boundedEvent>[]; connected: boolean; error?: string; diagnostics: KioskProviderDiagnostic };
    school: {
      assignments: Array<{ id: string; title: string; due: string; course?: string; completed: boolean }>;
      classes: Array<{ id: string; name: string; start: string; end: string; location?: string; instructor?: string }>;
      overdueCount: number;
      sceneState: "clear" | "upcoming" | "urgent" | "overdue" | "unavailable";
      connected: boolean;
      error?: string;
      diagnostics: KioskProviderDiagnostic;
    };
    garage: { connected: boolean; vehicle?: { id: string; nickname: string; mileage: number; status: string; fuelLevel?: number }; maintenanceDue: number; openIssues: number; priority?: string; updatedAt?: string };
    notes: { connected: boolean; total: number; recent?: { id: string; title: string; body: string; pinned: boolean; updatedAt: string }; updatedAt?: string };
    projects: { connected: boolean; openTasks: Array<{ id: string; title: string; priority: string; dueDate?: string; projectTitle?: string }>; updatedAt?: string };
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
    school: { assignments: [], classes: [], overdueCount: 0, sceneState: "unavailable", connected: false, diagnostics: { category: "account-not-found", configured: false, accountMatched: false, source: "kiosk-canvas-ical" } },
    garage: { connected: false, maintenanceDue: 0, openIssues: 0 },
    notes: { connected: false, total: 0 },
    projects: { connected: false, openTasks: [] },
    refreshDiagnostics: {
      weather: sceneRefreshDiagnostics(undefined, KIOSK_REFRESH_MS.weatherCurrent),
      calendar: sceneRefreshDiagnostics(undefined, KIOSK_REFRESH_MS.calendar),
      school: sceneRefreshDiagnostics(undefined, KIOSK_REFRESH_MS.school),
    },
    cosmicUpdate: readCosmicUpdateStatus(),
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
      const { getEnvironment } = await import("@/engines/environment");
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
    traceKioskCalendar("fetch=start");
    let engineResult: Awaited<ReturnType<typeof getDeveloperKioskCalendarEngine>> = null;
    try {
      engineResult = await withKioskDataProviderTimeout(getDeveloperKioskCalendarEngine(accountId));
    } catch (error) {
      if (process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview") {
        const detail = error instanceof Error ? error.message : String(error ?? "Unknown calendar provider error");
        console.error(`[kiosk-calendar] account-provider-error detail=${detail}`);
      }
      /* The kiosk iCal feeds are the bounded fallback. */
    }
    const engine = engineResult?.engine;
    if (engine && engineResult) {
      const events = await withKioskDataProviderTimeout(engine.getEvents({ start: now, end }));
      result.calendar = { connected: true, events: events.slice(0, MAX_EVENTS).map((event) => boundedEvent(event)), diagnostics: { category: "connected", configured: true, accountMatched: Boolean(accountId), source: "account-provider", feedCount: 0, ...(engineResult.context?.connection?.providerType ? { connectionType: engineResult.context.connection.providerType } : {}) } };
      result.refreshDiagnostics.calendar = sceneRefreshDiagnostics(new Date().toISOString(), KIOSK_REFRESH_MS.calendar);
      traceKioskCalendar("fetch=ok");
      traceKioskCalendar("parse=ok");
    } else {
      throw new Error("Account calendar unavailable.");
    }
  } catch {
    traceKioskCalendar("fetch=failed", "provider-or-timeout");
    const fallbackCalendars = [
      { url: process.env.COSMIC_KIOSK_ICAL_URL_1, name: "School" },
      { url: process.env.COSMIC_KIOSK_ICAL_URL_2, name: "Not Available" },
      { url: process.env.COSMIC_KIOSK_ICAL_URL_3, name: "Stetson Work" },
      { url: process.env.COSMIC_KIOSK_ICAL_URL_4, name: "Cosmic AI" },
    ].filter((calendar): calendar is { url: string; name: string } => Boolean(calendar.url?.trim()));
    const urls = fallbackCalendars.map((calendar) => calendar.url.trim());
    const calendarNames = fallbackCalendars.map((calendar) => calendar.name);
    if (!urls.length) {
      result.calendar = { connected: false, events: [], error: "Calendar is not configured.", diagnostics: { category: "configuration-error", configured: false, accountMatched: Boolean(process.env.COSMIC_KIOSK_ACCOUNT_ID?.trim()), source: "kiosk-ical", feedCount: 0 } };
      traceKioskCalendar("aggregate=missing", "configuration-error");
    } else {
      const fallback = await fetchKioskCalendarIcalFeeds(urls, fetch, calendarNames);
      const visibleEvents = fallback.events.filter((event) => event.end > now && event.start < end).slice(0, MAX_EVENTS).map((event) => boundedEvent(event));
      result.calendar = { connected: fallback.feedCount > 0, events: visibleEvents, ...(fallback.feedCount ? {} : { error: "Calendar feeds are temporarily unavailable." }), diagnostics: { category: fallback.feedCount ? "connected" : fallback.category, configured: true, accountMatched: Boolean(process.env.COSMIC_KIOSK_ACCOUNT_ID?.trim()), source: "kiosk-ical", feedCount: fallback.feedCount } };
      if (fallback.feedCount > 0) result.refreshDiagnostics.calendar = sceneRefreshDiagnostics(new Date().toISOString(), KIOSK_REFRESH_MS.calendar);
      traceKioskCalendar(fallback.feedCount > 0 ? "fetch=ok" : "fetch=failed", fallback.category);
      traceKioskCalendar(fallback.feedCount > 0 ? "parse=ok" : "aggregate=missing", fallback.category);
    }
  }

  if (accountId) {
    try {
      const cachedSchool = schoolCache.get(accountId);
      const school = cachedSchool && cachedSchool.expiresAt > Date.now()
        ? cachedSchool.value
        : await withKioskDataProviderTimeout(getDeveloperKioskSchoolData(accountId));
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
        classes: school.data.classes
          .filter((item) => item.end >= now)
          .filter((item) => !looksLikeAssignmentDeadline(item.name, item.start, item.end))
          .slice(0, 24)
          .map((item) => ({ id: item.id, name: item.name, start: item.start.toISOString(), end: item.end.toISOString(), ...(item.location ? { location: item.location } : {}), ...(item.instructor ? { instructor: item.instructor } : {}) })),
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
      result.school = { assignments: [], classes: [], overdueCount: 0, sceneState: "unavailable", connected: false, error: "School data temporarily unavailable.", diagnostics: { category: providerErrorCategory(error), configured: true, accountMatched: true, source: "account-provider" } };
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

  if (accountId) {
    try {
      const [garageDoc, notesDoc, projectsDoc] = await Promise.all([
        readCloudSnapshot(accountId, "garage"),
        readCloudSnapshot(accountId, "notes"),
        readCloudSnapshot(accountId, "projects"),
      ]);

      const garage = garageDoc?.snapshot as GarageLocalData | undefined;
      if (garage?.version === 1 && Array.isArray(garage.vehicles)) {
        const vehicle = garage.vehicles.find((item) => item.id === garage.selectedVehicleId) ?? garage.vehicles.find((item) => item.isPrimary) ?? garage.vehicles[0];
        if (vehicle) {
          const latestTelemetry = (garage.telemetrySnapshots ?? []).filter((item) => item.vehicleId === vehicle.id).sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
          const dueMaintenance = (garage.maintenance ?? []).filter((item) => item.vehicleId === vehicle.id && ((item.nextDueMileage !== undefined && vehicle.currentMileage >= item.nextDueMileage - 500) || (item.nextDueDate && new Date(item.nextDueDate).getTime() - now.getTime() <= 30 * 86_400_000)));
          const openIssues = (garage.issues ?? []).filter((item) => item.vehicleId === vehicle.id && item.status !== "resolved");
          const urgent = openIssues.find((item) => item.severity === "critical" || item.severity === "high");
          result.garage = {
            connected: true,
            vehicle: { id: vehicle.id, nickname: vehicle.nickname, mileage: vehicle.currentMileage, status: vehicle.status, ...(latestTelemetry?.fuelLevel !== undefined ? { fuelLevel: latestTelemetry.fuelLevel } : {}) },
            maintenanceDue: dueMaintenance.length,
            openIssues: openIssues.length,
            ...(urgent ? { priority: `${urgent.severity} issue: ${urgent.title}` } : dueMaintenance[0] ? { priority: `Maintenance: ${dueMaintenance[0].name}` } : {}),
            updatedAt: garageDoc?.updatedAt,
          };
        } else {
          result.garage = { connected: true, maintenanceDue: 0, openIssues: 0, updatedAt: garageDoc?.updatedAt };
        }
      }

      const notes = notesDoc?.snapshot as NotesLocalData | undefined;
      if (notes?.version === 1 && Array.isArray(notes.notes)) {
        const visible = notes.notes.filter((item) => !item.archived).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
        const recent = visible[0];
        result.notes = {
          connected: true,
          total: visible.length,
          ...(recent ? { recent: { id: recent.id, title: recent.title, body: recent.body, pinned: recent.pinned, updatedAt: recent.updatedAt } } : {}),
          updatedAt: notesDoc?.updatedAt,
        };
      }

      const projects = projectsDoc?.snapshot as ProjectsLocalData | undefined;
      if (projects?.version === 1 && Array.isArray(projects.tasks)) {
        const projectNames = new Map((projects.projects ?? []).map((item) => [item.id, item.title]));
        result.projects = {
          connected: true,
          openTasks: projects.tasks.filter((item) => !item.completed).sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") || a.order - b.order).slice(0, 12).map((item) => ({ id: item.id, title: item.title, priority: item.priority, ...(item.dueDate ? { dueDate: item.dueDate } : {}), ...(projectNames.get(item.projectId) ? { projectTitle: projectNames.get(item.projectId) } : {}) })),
          updatedAt: projectsDoc?.updatedAt,
        };
      }
    } catch {
      // Keep the individual live-data sections in their disconnected state.
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
    ? withKioskDiagnosticsTimeout(import("@/engines/environment").then(({ getEnvironment }) => getEnvironment(location.lat, location.lon)), 10_000)
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
