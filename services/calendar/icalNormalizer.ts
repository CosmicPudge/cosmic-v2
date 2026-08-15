import ICAL from "ical.js";
import type { CalendarEvent } from "@/core/contracts";

type IcalEvent = InstanceType<typeof ICAL.Event>;
type IcalTime = InstanceType<typeof ICAL.Time>;

export interface CalendarEventSource {
  calendarName: string;
  calendarId?: string;
  writable?: boolean;
  getWriteId?: (resourceHref: string, etag: string, event: CalendarEvent) => string;
}

export interface CalendarDateRange {
  start: Date;
  end: Date;
}

interface CalendarDataRecord {
  calendarData: string;
  resourceHref?: string;
  etag?: string;
}

function decodeCalendarData(value: string): string {
  return value
    .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function getCalendarData(xml: string): CalendarDataRecord[] {
  const responses = xml.match(/<[^:>]*:?response\b[\s\S]*?<\/[^:>]*:?response>/gi) ?? [xml];

  return responses.flatMap((response) => {
    const resourceHref = response.match(/<(?:[A-Za-z0-9_-]+:)?href[^>]*>\s*([^<]+?)\s*<\/(?:[A-Za-z0-9_-]+:)?href>/i)?.[1]?.trim();
    const etag = response.match(/<(?:[A-Za-z0-9_-]+:)?getetag[^>]*>\s*([^<]+?)\s*<\/(?:[A-Za-z0-9_-]+:)?getetag>/i)?.[1]?.trim();
    const matches = response.matchAll(/<(?:[A-Za-z0-9_-]+:)?calendar-data[^>]*>([\s\S]*?)<\/(?:[A-Za-z0-9_-]+:)?calendar-data>/gi);

    return Array.from(matches, (match) => ({
      calendarData: decodeCalendarData(match[1]),
      ...(resourceHref ? { resourceHref } : {}),
      ...(etag ? { etag } : {}),
    }));
  });
}

function getTimeZone(time: IcalTime): string | undefined {
  return time.isDate ? undefined : time.zone.tzid;
}

function occursInRange(
  start: Date,
  end: Date,
  range: CalendarDateRange
): boolean {
  return start < range.end && end > range.start;
}

function normalizeEvent(
  event: IcalEvent,
  startTime: IcalTime,
  endTime: IcalTime,
  source: CalendarEventSource,
  recurrenceId?: IcalTime,
  writeId?: string
): CalendarEvent {
  const uid = event.uid || undefined;
  const recurrenceValue = recurrenceId?.toString();
  const id = uid
    ? recurrenceValue
      ? `${uid}:${recurrenceValue}`
      : uid
    : `${source.calendarName}:${startTime.toString()}`;

  return {
    id,
    ...(uid ? { uid } : {}),
    title: event.summary || "Untitled event",
    ...(event.description
      ? { description: event.description }
      : {}),
    start: startTime.toJSDate(),
    end: endTime.toJSDate(),
    ...(event.location ? { location: event.location } : {}),
    allDay: startTime.isDate,
    calendarName: source.calendarName,
    ...(source.calendarId
      ? { calendarId: source.calendarId }
      : {}),
    ...(source.writable && !event.isRecurring() && !startTime.isDate && writeId
      ? { writable: true, writeId }
      : {}),
    ...(getTimeZone(startTime)
      ? { startTimeZone: getTimeZone(startTime) }
      : {}),
    ...(getTimeZone(endTime)
      ? { endTimeZone: getTimeZone(endTime) }
      : {}),
    isRecurring: event.isRecurring(),
    ...(event.isRecurring()
      ? { recurrenceWritable: false }
      : {}),
    ...(recurrenceValue ? { recurrenceId: recurrenceValue } : {}),
    travelRequired: false,
    completed: false,
  };
}

function normalizeCalendar(
  calendarData: string,
  source: CalendarEventSource,
  range: CalendarDateRange,
  resource?: Pick<CalendarDataRecord, "resourceHref" | "etag">
): CalendarEvent[] {
  const calendar = new ICAL.Component(
    ICAL.parse(calendarData)
  );
  const components = calendar.getAllSubcomponents("vevent");
  const exceptionsByUid = new Map<
    string,
    InstanceType<typeof ICAL.Component>[]
  >();

  for (const component of components) {
    if (!component.hasProperty("recurrence-id")) {
      continue;
    }

    const uid = new ICAL.Event(component).uid;

    if (!uid) {
      continue;
    }

    const exceptions = exceptionsByUid.get(uid) ?? [];

    exceptions.push(component);
    exceptionsByUid.set(uid, exceptions);
  }

  return components.flatMap((component) => {
    if (component.hasProperty("recurrence-id")) {
      return [];
    }

    const uid = new ICAL.Event(component).uid;
    const event = new ICAL.Event(component, {
      strictExceptions: true,
      exceptions: exceptionsByUid.get(uid) ?? [],
    });

    if (!event.isRecurring()) {
      const start = event.startDate.toJSDate();
      const end = event.endDate.toJSDate();

      return occursInRange(start, end, range)
        ? [
            normalizeEvent(
              event,
              event.startDate,
              event.endDate,
              source,
              undefined,
              resource?.resourceHref && resource.etag
                ? source.getWriteId?.(resource.resourceHref, resource.etag, normalizeEvent(event, event.startDate, event.endDate, source))
                : undefined
            ),
          ]
        : [];
    }

    const occurrences: CalendarEvent[] = [];
    const iterator = event.iterator();
    let occurrence = iterator.next();

    while (occurrence) {
      const details = event.getOccurrenceDetails(occurrence);
      const start = details.startDate.toJSDate();
      const end = details.endDate.toJSDate();

      if (start >= range.end) {
        break;
      }

      if (occursInRange(start, end, range)) {
        occurrences.push(
          normalizeEvent(
            details.item,
            details.startDate,
            details.endDate,
            source,
            details.recurrenceId
          )
        );
      }

      occurrence = iterator.next();
    }

    return occurrences;
  });
}

export function normalizeCalDavCalendarData(
  rawResponse: string,
  source: CalendarEventSource,
  range: CalendarDateRange
): CalendarEvent[] {
  return getCalendarData(rawResponse).flatMap((record) =>
    normalizeCalendar(record.calendarData, source, range, record)
  );
}
