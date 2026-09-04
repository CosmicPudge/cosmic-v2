import ICAL from "ical.js";
import type { SchoolEvent } from "./types";
// @ts-expect-error Node's strip-types runner resolves the source extension directly.
import { classifyEvent, normalizeCanvasCalendarCompletion, type CanvasEventMetadata } from "./classifier.ts";

export interface CanvasCalendarDiagnostics {
  totalIcsEvents: number;
  parsedEvents: number;
  assignments: number;
  classes: number;
  otherEvents: number;
}

export interface ParsedCanvasCalendar {
  events: SchoolEvent[];
  diagnostics: CanvasCalendarDiagnostics;
}

function propertyValue(component: ICAL.Component, name: string): string | undefined {
  const value = component.getFirstPropertyValue(name);
  return typeof value === "string" ? value : undefined;
}

function propertyValues(component: ICAL.Component, name: string): string[] {
  return component.getAllProperties(name).flatMap((property) => property.getValues())
    .filter((value): value is string => typeof value === "string");
}

function stringValue(value: unknown) { return typeof value === "string" ? value : value && typeof value.toString === "function" ? value.toString() : undefined; }

function property(component: ICAL.Component, name: string) {
  const item = component.getFirstProperty(name);
  return item ? { value: item.jCal?.[3] ?? item.getFirstValue(), params: item.jCal?.[1] as Record<string, unknown> | undefined } : undefined;
}

function completionMetadata(component: ICAL.Component): Pick<CanvasEventMetadata, "completionState" | "completionFlag"> {
  const candidates = component.getAllProperties().flatMap((item) => {
    const name = item.name?.toLowerCase().replace(/^x-canvas-/, "") ?? "";
    if (!/(complete|workflow.?state|submission|grade|excused|status)/.test(name)) return [];
    const value = stringValue(item.getFirstValue());
    return value ? [{ name, value }] : [];
  });
  const explicit = candidates.find(({ name, value }) => name !== "status" && /^(true|false|yes|no|1|0)$/i.test(value));
  const state = candidates.find(({ name }) => name !== "status" && /(workflow.?state|submission|complete|grade|excused)/.test(name));
  const completedStatus = candidates.find(({ name, value }) => name === "status" && /^(completed|complete)$/i.test(value));
  return {
    ...((state?.value ?? completedStatus?.value) ? { completionState: state?.value ?? completedStatus?.value } : {}),
    ...(explicit ? { completionFlag: /^(true|yes|1)$/i.test(explicit.value) } : {}),
  };
}

function parseEvent(component: ICAL.Component): SchoolEvent {
  const event = new ICAL.Event(component);
  const metadata: CanvasEventMetadata = {
    uid: event.uid ?? undefined,
    url: propertyValue(component, "url"),
    categories: propertyValues(component, "categories"),
    ...completionMetadata(component),
  };
  const courseId = (metadata.url ?? "").match(/\/courses\/(\d+)(?:\/|$)/i)?.[1];

  const recurrenceId = stringValue(property(component, "recurrence-id")?.value);
  const sequence = property(component, "sequence")?.value;
  const lastModified = stringValue(property(component, "last-modified")?.value);
  const dtstamp = stringValue(property(component, "dtstamp")?.value);
  const rrule = stringValue(property(component, "rrule")?.value);

  return {
    id: event.uid,
    title: event.summary ?? "Untitled",
    start: event.startDate.toJSDate(),
    end: event.endDate.toJSDate(),
    description: event.description ?? undefined,
    location: event.location ?? undefined,
    type: classifyEvent(event.summary ?? "", event.description ?? "", metadata),
    source: "canvas-calendar",
    ...(courseId ? { courseId } : {}),
    ...(event.startDate.isDate ? { allDay: true } : {}),
    sourceMetadata: {
      ...(metadata.uid ? { uid: metadata.uid } : {}),
      ...(recurrenceId ? { recurrenceId } : {}),
      ...(rrule ? { rrule } : {}),
      ...(typeof propertyValue(component, "status") === "string" ? { status: propertyValue(component, "status") } : {}),
      ...(typeof sequence === "number" ? { sequence } : {}),
      ...(lastModified ? { lastModified } : {}),
      ...(dtstamp ? { dtstamp } : {}),
      ...(metadata.url ? { url: metadata.url } : {}),
      ...(normalizeCanvasCalendarCompletion(metadata) !== "unknown" ? { completionStatus: normalizeCanvasCalendarCompletion(metadata) } : {}),
      ...(metadata.completionState ? { providerCompletionState: metadata.completionState } : {}),
    },
  };
}

export function parseCanvasCalendar(ics: string): SchoolEvent[] {
  return parseCanvasCalendarWithDiagnostics(ics).events;
}

export function parseCanvasCalendarWithDiagnostics(ics: string): ParsedCanvasCalendar {
  const jcal = ICAL.parse(ics);
  const calendar = new ICAL.Component(jcal);
  const vevents = calendar.getAllSubcomponents("vevent");
  const events: SchoolEvent[] = [];

  for (const component of vevents) {
    try {
      events.push(parseEvent(component));
    } catch {
      // Keep one malformed VEVENT from hiding the valid events in the feed.
    }
  }

  const assignments = events.filter((event) => event.type === "assignment").length;
  const classes = events.filter((event) => event.type === "class").length;
  return {
    events,
    diagnostics: {
      totalIcsEvents: vevents.length,
      parsedEvents: events.length,
      assignments,
      classes,
      otherEvents: events.length - assignments - classes,
    },
  };
}
