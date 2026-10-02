import "server-only";

import ICAL from "ical.js";
import type { CalendarEvent } from "@/core/contracts";
import { buildDashboard } from "@/components/school/data/engine/engine";
import { parseCanvasCalendarWithDiagnostics } from "@/components/school/data/parser";
import type { SchoolDashboardData } from "@/components/school/data/types";

export type KioskIcalFeedCategory = "connected" | "provider-error" | "parse-error";

export interface KioskCalendarIcalResult {
  events: CalendarEvent[];
  feedCount: number;
  category: KioskIcalFeedCategory;
}

export interface KioskCanvasIcalResult {
  data: SchoolDashboardData;
  parsedEvents: number;
}

function calendarEvent(component: ICAL.Component, calendarName: string): CalendarEvent {
  const event = new ICAL.Event(component);
  const start = event.startDate.toJSDate();
  const end = event.endDate.toJSDate();
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) throw new Error("Invalid iCal event date.");
  const uid = event.uid || `${start.toISOString()}:${event.summary ?? "event"}`;
  return {
    id: uid,
    uid,
    title: event.summary || "Untitled event",
    ...(event.description ? { description: event.description } : {}),
    start,
    end,
    ...(event.location ? { location: event.location } : {}),
    ...(event.startDate.isDate ? { allDay: true } : {}),
    calendarName,
    source: "subscription",
    category: "personal",
    priority: "normal",
    travelRequired: false,
    completed: false,
  };
}

export function parseKioskCalendarIcal(ics: string, calendarName: string): CalendarEvent[] {
  const calendar = new ICAL.Component(ICAL.parse(ics));
  return calendar.getAllSubcomponents("vevent").flatMap((component) => {
    try { return [calendarEvent(component, calendarName)]; } catch { return []; }
  });
}

async function fetchText(url: string, fetchImpl: typeof fetch) {
  const response = await fetchImpl(url, { cache: "no-store", headers: { Accept: "text/calendar" } });
  if (!response.ok) throw new Error("Kiosk iCal feed unavailable.");
  return response.text();
}

export async function fetchKioskCalendarIcalFeeds(urls: string[], fetchImpl: typeof fetch = fetch): Promise<KioskCalendarIcalResult> {
  const results = await Promise.all(urls.map(async (url, index) => {
    let body: string;
    try { body = await fetchText(url, fetchImpl); } catch { return { events: [] as CalendarEvent[], category: "provider-error" as const }; }
    try { return { events: parseKioskCalendarIcal(body, `Kiosk calendar ${index + 1}`), category: "connected" as const }; }
    catch { return { events: [] as CalendarEvent[], category: "parse-error" as const }; }
  }));
  const successful = results.filter((result) => result.category === "connected");
  const seen = new Set<string>();
  const events = successful.flatMap((result) => result.events).filter((event) => {
    const key = `${event.uid ?? event.id}|${event.start.toISOString()}|${event.end.toISOString()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((left, right) => left.start.getTime() - right.start.getTime());
  return {
    events,
    feedCount: successful.length,
    category: successful.length ? "connected" : results.some((result) => result.category === "parse-error") ? "parse-error" : "provider-error",
  };
}

export async function fetchKioskCanvasIcal(url: string, fetchImpl: typeof fetch = fetch): Promise<KioskCanvasIcalResult> {
  const response = await fetchImpl(url, { cache: "no-store", headers: { Accept: "text/calendar" } });
  if (!response.ok) throw new Error("Kiosk Canvas iCal feed unavailable.");
  let parsed: ReturnType<typeof parseCanvasCalendarWithDiagnostics>;
  try { parsed = parseCanvasCalendarWithDiagnostics(await response.text()); }
  catch { throw new SyntaxError("Kiosk Canvas iCal feed could not be parsed."); }
  return { data: buildDashboard(parsed.events), parsedEvents: parsed.diagnostics.parsedEvents };
}
