import "server-only";

import { getEnvironment } from "@/engines/environment";
import { getDeveloperKioskCalendarEngine } from "@/services/calendar/accountProvider";
import { getDeveloperKioskSchoolData } from "@/services/school/server";
import type { CalendarEvent } from "@/core/contracts";

const DEFAULT_HOST = "dev.cosmicpudge.shop";
const MAX_EVENTS = 8;
const MAX_ASSIGNMENTS = 8;

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
    calendar: { events: ReturnType<typeof boundedEvent>[]; connected: boolean; error?: string };
    school: { assignments: Array<{ id: string; title: string; due: string; course?: string; completed: boolean }>; overdueCount: number; sceneState: "clear" | "upcoming" | "urgent" | "overdue" | "unavailable"; connected: boolean; error?: string };
  } = {
    location,
    weather: null,
    calendar: { events: [], connected: false },
    school: { assignments: [], overdueCount: 0, sceneState: "unavailable", connected: false },
  };

  if (location) {
    try { result.weather = await getEnvironment(location.lat, location.lon); }
    catch { /* The client renders the designed unavailable state. */ }
  }

  try {
    const engine = (await getDeveloperKioskCalendarEngine(process.env.COSMIC_KIOSK_ACCOUNT_ID))?.engine;
    if (engine) {
      const events = await engine.getEvents({ start: now, end });
      result.calendar = { connected: true, events: events.slice(0, MAX_EVENTS).map((event) => boundedEvent(event)) };
    }
  } catch { result.calendar = { connected: false, events: [], error: "Calendar temporarily unavailable." }; }

  const accountId = process.env.COSMIC_KIOSK_ACCOUNT_ID?.trim();
  if (accountId) {
    try {
      const school = await getDeveloperKioskSchoolData(accountId);
      const assignments = school.snapshot.planningAssignments ?? [];
      const upcoming = assignments.filter((item) => item.dueAt && item.completionStatus !== "completed").sort((a, b) => a.dueAt!.getTime() - b.dueAt!.getTime());
      const overdueCount = upcoming.filter((item) => item.dueAt! < now).length;
      const urgentHours = Math.max(1, Number(process.env.COSMIC_KIOSK_SCHOOL_URGENT_HOURS ?? 24));
      const nextDue = upcoming[0]?.dueAt;
      result.school = {
        connected: school.snapshot.sourceStatus?.canvas !== "not_connected",
        assignments: upcoming.slice(0, MAX_ASSIGNMENTS).map((item) => ({ id: item.id.slice(0, 160), title: item.title.slice(0, 240), due: item.dueAt!.toISOString(), ...(item.courseName ? { course: item.courseName.slice(0, 120) } : {}), completed: item.completionStatus === "completed" })),
        overdueCount,
        sceneState: overdueCount > 0 ? "overdue" : nextDue && nextDue.getTime() - now.getTime() <= urgentHours * 60 * 60 * 1000 ? "urgent" : nextDue ? "upcoming" : "clear",
        ...(school.error ? { error: "School data temporarily unavailable." } : {}),
      };
    } catch { result.school = { assignments: [], overdueCount: 0, sceneState: "unavailable", connected: false, error: "School data temporarily unavailable." }; }
  }

  return result;
}
