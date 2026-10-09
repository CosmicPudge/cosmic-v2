import "server-only";

import ICAL from "ical.js";
import type { CalendarEvent } from "@/core/contracts";
import { buildDashboard } from "@/components/school/data/engine/engine";
import { parseCanvasCalendarWithDiagnostics } from "@/components/school/data/parser";
import type { SchoolDashboardData } from "@/components/school/data/types";
import { fetchWithTimeout } from "@/services/kiosk/fetchWithTimeout";

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

export interface KioskIcalWindow {
  start: Date;
  end: Date;
}

function calendarEvent(event: ICAL.Event, calendarName: string, occurrence?: ReturnType<ICAL.Event["getOccurrenceDetails"]>): CalendarEvent {
  const source = occurrence?.item ?? event;
  const start = (occurrence?.startDate ?? event.startDate).toJSDate();
  const end = (occurrence?.endDate ?? event.endDate).toJSDate();
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) throw new Error("Invalid iCal event date.");
  const uid = event.uid || `${start.toISOString()}:${source.summary ?? "event"}`;
  const recurrenceId = occurrence?.recurrenceId?.toString();
  return {
    id: recurrenceId ? `${uid}:${recurrenceId}` : uid,
    uid,
    title: source.summary || "Untitled event",
    ...(source.description ? { description: source.description } : {}),
    start,
    end,
    ...(source.location ? { location: source.location } : {}),
    ...((occurrence?.startDate ?? event.startDate).isDate ? { allDay: true } : {}),
    calendarName,
    source: "subscription",
    category: "personal",
    priority: "normal",
    travelRequired: false,
    completed: false,
    ...(recurrenceId ? { recurrenceId, isRecurring: true } : {}),
  };
}

export function parseKioskCalendarIcal(ics: string, calendarName: string, window?: KioskIcalWindow): CalendarEvent[] {
  const calendar = new ICAL.Component(ICAL.parse(ics));
  return calendar.getAllSubcomponents("vevent").flatMap((component) => {
    try {
      const event = new ICAL.Event(component);
      if (!event.isRecurring() || !window) return [calendarEvent(event, calendarName)];
      const occurrences: CalendarEvent[] = [];
      const iterator = event.iterator(event.startDate);
      for (let count = 0; count < 512; count += 1) {
        const occurrence = iterator.next();
        if (!occurrence) break;
        const details = event.getOccurrenceDetails(occurrence);
        const start = details.startDate.toJSDate();
        const end = details.endDate.toJSDate();
        if (start >= window.end) break;
        if (end > window.start) occurrences.push(calendarEvent(event, calendarName, details));
      }
      return occurrences;
    } catch { return []; }
  });
}

async function fetchText(url: string, fetchImpl: typeof fetch) {
  const response = await fetchWithTimeout(url, { cache: "no-store", headers: { Accept: "text/calendar" } }, undefined, fetchImpl);
  if (!response.ok) throw new Error("Kiosk iCal feed unavailable.");
  return response.text();
}

export async function fetchKioskCalendarIcalFeeds(\n  urls: string[],\n  fetchImpl: typeof fetch = fetch,\n  calendarNames: string[] = ["School", "Not Available"],\n): Promise<KioskCalendarIcalResult> {
  const window = { start: new Date(), end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) };
  const results = await Promise.all(urls.map(async (url, index) => {
    let body: string;
    try { body = await fetchText(url, fetchImpl); } catch { return { events: [] as CalendarEvent[], category: "provider-error" as const }; }
    try { return { events: parseKioskCalendarIcal(body, calendarNames[index] ?? `Kiosk calendar ${index + 1}`, window), category: "connected" as const }; }
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
