import "server-only";

import { getEnvironment } from "@/engines/environment";
import { getDeveloperKioskCalendarEngine } from "@/services/calendar/accountProvider";
import { fetchKioskCalendarIcalFeeds } from "@/services/kiosk/icalFallback";
import { getDeveloperKioskSchoolData } from "@/services/school/server";
import { isAssignmentActiveForPlanning } from "@/services/school/planning";
import type { CalendarEvent } from "@/core/contracts";

const DEFAULT_HOST = "dev.cosmicpudge.shop";
const MAX_EVENTS = 8;
const MAX_ASSIGNMENTS = 8;

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

function kioskLocation() {
  const lat = Number(process.env.COSMIC_KIOSK_LAT);
  const lon = Number(process.env.COSMIC_KIOSK_LON);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon, label: process.env.COSMIC_KIOSK_LOCATION_LABEL?.trim() || "Kiosk location" };
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

export async function getDeveloperKioskData() {
  const location = kioskLocation();
  const now = new Date();
  const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const result: {
    location: typeof location;
    weather: unknown | null;
    calendar: { events: ReturnType<typeof boundedEvent>[]; connected: boolean; error?: string; diagnostics: KioskProviderDiagnostic };
    school: { assignments: Array<{ id: string; title: string; due: string; course?: string; completed: boolean }>; overdueCount: number; sceneState: "clear" | "upcoming" | "urgent" | "overdue" | "unavailable"; connected: boolean; error?: string; diagnostics: KioskProviderDiagnostic };
  } = {
    location,
    weather: null,
    calendar: { events: [], connected: false, diagnostics: { category: "configuration-error", configured: false, accountMatched: false, source: "kiosk-ical", feedCount: 0 } },
    school: { assignments: [], overdueCount: 0, sceneState: "unavailable", connected: false, diagnostics: { category: "account-not-found", configured: false, accountMatched: false, source: "kiosk-canvas-ical" } },
  };

  if (location) {
    try { result.weather = await getEnvironment(location.lat, location.lon); }
    catch { /* The client renders the designed unavailable state. */ }
  }

  try {
    const accountId = process.env.COSMIC_KIOSK_ACCOUNT_ID?.trim();
    let engineResult: Awaited<ReturnType<typeof getDeveloperKioskCalendarEngine>> = null;
    try { engineResult = await getDeveloperKioskCalendarEngine(accountId); } catch { /* The kiosk iCal feeds are the bounded fallback. */ }
    const engine = engineResult?.engine;
    if (engine && engineResult) {
      const events = await engine.getEvents({ start: now, end });
      result.calendar = { connected: true, events: events.slice(0, MAX_EVENTS).map((event) => boundedEvent(event)), diagnostics: { category: "connected", configured: true, accountMatched: Boolean(accountId), source: "account-provider", feedCount: 0, ...(engineResult.context?.connection?.providerType ? { connectionType: engineResult.context.connection.providerType } : {}) } };
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
    }
  }

  const accountId = process.env.COSMIC_KIOSK_ACCOUNT_ID?.trim();
  if (accountId) {
    try {
      const school = await getDeveloperKioskSchoolData(accountId);
      const schoolUsesIcal = school.kioskSource === "kiosk-canvas-ical";
      const assignments = (school.snapshot.planningAssignments ?? []).filter((item) => isAssignmentActiveForPlanning(item) && (!schoolUsesIcal || (item.dueAt && item.dueAt >= now)));
      const upcoming = assignments.filter((item) => item.dueAt && item.completionStatus !== "completed").sort((a, b) => a.dueAt!.getTime() - b.dueAt!.getTime());
      const overdueCount = schoolUsesIcal ? 0 : upcoming.filter((item) => item.dueAt! < now).length;
      const urgentHours = Math.max(1, Number(process.env.COSMIC_KIOSK_SCHOOL_URGENT_HOURS ?? 24));
      const nextDue = upcoming[0]?.dueAt;
      const connected = !school.error && school.snapshot.sourceStatus?.canvas === "healthy";
      result.school = {
        connected,
        assignments: upcoming.slice(0, MAX_ASSIGNMENTS).map((item) => ({ id: item.id.slice(0, 160), title: item.title.slice(0, 240), due: item.dueAt!.toISOString(), ...(item.courseName ? { course: item.courseName.slice(0, 120) } : {}), completed: item.completionStatus === "completed" })),
        overdueCount,
        sceneState: overdueCount > 0 ? "overdue" : nextDue ? (nextDue.getTime() - now.getTime() <= urgentHours * 60 * 60 * 1000 ? "urgent" : "upcoming") : "clear",
        ...(school.error ? { error: "School data temporarily unavailable." } : {}),
        diagnostics: { category: school.errorCategory ?? (connected ? "connected" : "provider-not-found"), configured: true, accountMatched: true, source: school.kioskSource ?? "account-provider", ...(connected ? { connectionType: "canvas-rest-or-calendar" } : {}), accountProviderSucceeded: school.accountProviderSucceeded ?? false, canvasIcalConfigured: school.canvasIcalConfigured ?? false, canvasIcalAttempted: school.canvasIcalAttempted ?? false, canvasIcalSucceeded: school.canvasIcalSucceeded ?? false },
      };
    } catch (error) { result.school = { assignments: [], overdueCount: 0, sceneState: "unavailable", connected: false, error: "School data temporarily unavailable.", diagnostics: { category: providerErrorCategory(error), configured: true, accountMatched: true, source: "account-provider" } }; }
  }

  return result;
}
