import "server-only";

import { getEnvironment } from "@/engines/environment";
import { getDeveloperKioskCalendarEngine } from "@/services/calendar/accountProvider";
import { getDeveloperKioskSchoolData } from "@/services/school/server";
import type { CalendarEvent } from "@/core/contracts";

const DEFAULT_HOST = "dev.cosmicpudge.shop";
const MAX_EVENTS = 8;
const MAX_ASSIGNMENTS = 8;

export type KioskProviderDiagnostic = {
  category: "connected" | "provider-not-found" | "account-not-found" | "provider-error" | "configuration-error";
  configured: boolean;
  accountMatched: boolean;
  connectionType?: string;
};

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
    calendar: { events: [], connected: false, diagnostics: { category: "configuration-error", configured: false, accountMatched: false } },
    school: { assignments: [], overdueCount: 0, sceneState: "unavailable", connected: false, diagnostics: { category: "account-not-found", configured: false, accountMatched: false } },
  };

  if (location) {
    try { result.weather = await getEnvironment(location.lat, location.lon); }
    catch { /* The client renders the designed unavailable state. */ }
  }

  try {
    const accountId = process.env.COSMIC_KIOSK_ACCOUNT_ID?.trim();
    const engineResult = await getDeveloperKioskCalendarEngine(accountId);
    const engine = engineResult?.engine;
    if (engine) {
      const events = await engine.getEvents({ start: now, end });
      result.calendar = { connected: true, events: events.slice(0, MAX_EVENTS).map((event) => boundedEvent(event)), diagnostics: { category: "connected", configured: true, accountMatched: Boolean(accountId), ...(engineResult.context?.connection?.providerType ? { connectionType: engineResult.context.connection.providerType } : {}) } };
    } else {
      result.calendar = { connected: false, events: [], diagnostics: { category: accountId ? "provider-not-found" : "account-not-found", configured: Boolean(process.env.APPLE_CALENDAR_USERNAME && process.env.APPLE_CALENDAR_PASSWORD), accountMatched: Boolean(accountId) } };
    }
  } catch { result.calendar = { connected: false, events: [], error: "Calendar temporarily unavailable.", diagnostics: { category: "provider-error", configured: true, accountMatched: Boolean(process.env.COSMIC_KIOSK_ACCOUNT_ID?.trim()) } }; }

  const accountId = process.env.COSMIC_KIOSK_ACCOUNT_ID?.trim();
  if (accountId) {
    try {
      const school = await getDeveloperKioskSchoolData(accountId);
      const assignments = school.snapshot.planningAssignments ?? [];
      const upcoming = assignments.filter((item) => item.dueAt && item.completionStatus !== "completed").sort((a, b) => a.dueAt!.getTime() - b.dueAt!.getTime());
      const overdueCount = upcoming.filter((item) => item.dueAt! < now).length;
      const urgentHours = Math.max(1, Number(process.env.COSMIC_KIOSK_SCHOOL_URGENT_HOURS ?? 24));
      const nextDue = upcoming[0]?.dueAt;
      const connected = school.snapshot.sourceStatus?.canvas !== "not_connected";
      result.school = {
        connected,
        assignments: upcoming.slice(0, MAX_ASSIGNMENTS).map((item) => ({ id: item.id.slice(0, 160), title: item.title.slice(0, 240), due: item.dueAt!.toISOString(), ...(item.courseName ? { course: item.courseName.slice(0, 120) } : {}), completed: item.completionStatus === "completed" })),
        overdueCount,
        sceneState: overdueCount > 0 ? "overdue" : nextDue && nextDue.getTime() - now.getTime() <= urgentHours * 60 * 60 * 1000 ? "urgent" : nextDue ? "upcoming" : "clear",
        ...(school.error ? { error: "School data temporarily unavailable." } : {}),
        diagnostics: { category: school.error ? "provider-error" : connected ? "connected" : "provider-not-found", configured: true, accountMatched: true, ...(connected ? { connectionType: "canvas-rest-or-calendar" } : {}) },
      };
    } catch { result.school = { assignments: [], overdueCount: 0, sceneState: "unavailable", connected: false, error: "School data temporarily unavailable.", diagnostics: { category: "provider-error", configured: true, accountMatched: true } }; }
  }

  return result;
}
