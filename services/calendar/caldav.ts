const DAV_NAMESPACE = "DAV:";
const CALDAV_NAMESPACE =
  "urn:ietf:params:xml:ns:caldav";

import { createHash } from "node:crypto";

export interface CalDavConfig {
  username: string;
  password: string;
  serverUrl: string;
}

export interface CalDavDiscovery {
  principalUrl: string;
  calendarHomeUrl: string;
}

export interface CalDavCalendar {
  url: string;
  displayName: string;
  color?: string;
  description?: string;
  supportedComponents: string[];
}

export function getCalDavCalendarId(
  calendar: CalDavCalendar
): string {
  return createHash("sha256")
    .update(calendar.url)
    .digest("hex");
}

export function formatCalDavDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function getHref(
  xml: string,
  tag: string
): string | null {
  const escapedTag = tag.replace(
    /[-/\\^$*+?.()|[\]{}]/g,
    "\\$&"
  );

  const containerMatch = xml.match(
    new RegExp(
      `<(?:[A-Za-z0-9_-]+:)?${escapedTag}[^>]*>[\\s\\S]*?<\\/(?:[A-Za-z0-9_-]+:)?${escapedTag}>`,
      "i"
    )
  );

  if (!containerMatch) {
    return null;
  }

  const hrefMatch =
    containerMatch[0].match(
      /<(?:[A-Za-z0-9_-]+:)?href[^>]*>\s*([^<]+?)\s*<\/(?:[A-Za-z0-9_-]+:)?href>/i
    );

  return hrefMatch?.[1]?.trim() ?? null;
}

function resolveUrl(
  baseUrl: string,
  href: string
): string {
  return new URL(href, baseUrl).toString();
}

function extractTagValue(
  xml: string,
  tag: string
): string | undefined {
  const escapedTag = tag.replace(
    /[-/\\^$*+?.()|[\]{}]/g,
    "\\$&"
  );

  return xml.match(
    new RegExp(
      `<(?:[A-Za-z0-9_-]+:)?${escapedTag}[^>]*>\\s*([^<]*?)\\s*<\\/(?:[A-Za-z0-9_-]+:)?${escapedTag}>`,
      "i"
    )
  )?.[1]?.trim();
}

async function davRequest(
  url: string,
  config: CalDavConfig,
  body: string
): Promise<string> {
  const response = await fetch(url, {
    method: "PROPFIND",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(
          `${config.username}:${config.password}`
        ).toString("base64"),

      Depth: "0",

      "Content-Type":
        "application/xml; charset=utf-8",
    },

    body,

    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `iCloud CalDAV request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.text();
}

export async function discoverCalDav(
  config: CalDavConfig
): Promise<CalDavDiscovery> {
  const principalBody = `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="${DAV_NAMESPACE}">
  <d:prop>
    <d:current-user-principal />
  </d:prop>
</d:propfind>`;

  const principalResponse = await davRequest(
    config.serverUrl,
    config,
    principalBody
  );

  const principalHref = getHref(
    principalResponse,
    "current-user-principal"
  );

  if (!principalHref) {
    throw new Error(
      "iCloud did not return a current-user-principal."
    );
  }

  const principalUrl = resolveUrl(
    config.serverUrl,
    principalHref
  );

  const calendarHomeBody = `<?xml version="1.0" encoding="utf-8"?>
<d:propfind
  xmlns:d="${DAV_NAMESPACE}"
  xmlns:c="${CALDAV_NAMESPACE}"
>
  <d:prop>
    <c:calendar-home-set />
  </d:prop>
</d:propfind>`;

  const calendarHomeResponse =
    await davRequest(
      principalUrl,
      config,
      calendarHomeBody
    );

  const calendarHomeHref = getHref(
    calendarHomeResponse,
    "calendar-home-set"
  );

  if (!calendarHomeHref) {
    throw new Error(
      "iCloud did not return a calendar-home-set."
    );
  }

  const calendarHomeUrl = resolveUrl(
    principalUrl,
    calendarHomeHref
  );

  return {
    principalUrl,
    calendarHomeUrl,
  };
}

export async function discoverCalendars(
  config: CalDavConfig,
  calendarHomeUrl: string
): Promise<CalDavCalendar[]> {
  const body = `<?xml version="1.0" encoding="utf-8"?>
<d:propfind
  xmlns:d="${DAV_NAMESPACE}"
  xmlns:c="${CALDAV_NAMESPACE}"
>
  <d:prop>
    <d:displayname />
    <d:resourcetype />
    <c:calendar-description />
    <c:calendar-color />
    <c:supported-calendar-component-set />
  </d:prop>
</d:propfind>`;

  const response = await fetch(
    calendarHomeUrl,
    {
      method: "PROPFIND",

      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            `${config.username}:${config.password}`
          ).toString("base64"),

        Depth: "1",

        "Content-Type":
          "application/xml; charset=utf-8",
      },

      body,

      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `iCloud calendar discovery failed: ${response.status} ${response.statusText}`
    );
  }

  const xml = await response.text();

  const responses =
    xml.match(
      /<[^:>]*:?response\b[\s\S]*?<\/[^:>]*:?response>/gi
    ) ?? [];

  const calendars: CalDavCalendar[] = [];

  for (const item of responses) {
    const href =
      item.match(
        /<(?:[A-Za-z0-9_-]+:)?href[^>]*>\s*([^<]+?)\s*<\/(?:[A-Za-z0-9_-]+:)?href>/i
      )?.[1]?.trim();

    const displayName =
      extractTagValue(
        item,
        "displayname"
      );

    if (!href || !displayName) {
      continue;
    }

    const resourceType =
      item.match(
        /<(?:[A-Za-z0-9_-]+:)?resourcetype[^>]*>([\s\S]*?)<\/(?:[A-Za-z0-9_-]+:)?resourcetype>/i
      )?.[1] ?? "";

    const isCalendar =
      /<(?:[A-Za-z0-9_-]+:)?calendar\b/i.test(
        resourceType
      );

    if (!isCalendar) {
      continue;
    }

    const color =
      extractTagValue(
        item,
        "calendar-color"
      );

    const description =
      extractTagValue(
        item,
        "calendar-description"
      );

    const supportedComponents =
      Array.from(
        item.matchAll(
          /<[^:>]*:?comp\b[^>]*\bname=["']([^"']+)["'][^>]*\/?>/gi
        )
      ).map(
        (match) => match[1]
      );

    calendars.push({
      url: new URL(
        href,
        calendarHomeUrl
      ).toString(),

      displayName,

      ...(color
        ? { color }
        : {}),

      ...(description
        ? { description }
        : {}),

      supportedComponents,
    });
  }

  return calendars;
}

export async function fetchCalendarEvents(
  config: CalDavConfig,
  calendar: CalDavCalendar,
  start: Date,
  end: Date
): Promise<string> {
  const body = `<?xml version="1.0" encoding="utf-8"?>
<c:calendar-query
  xmlns:d="${DAV_NAMESPACE}"
  xmlns:c="${CALDAV_NAMESPACE}"
>
  <d:prop>
    <d:getetag />
    <c:calendar-data />
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VEVENT">
        <c:time-range
          start="${formatCalDavDate(start)}"
          end="${formatCalDavDate(end)}"
        />
      </c:comp-filter>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`;

  const response = await fetch(calendar.url, {
    method: "REPORT",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(
          `${config.username}:${config.password}`
        ).toString("base64"),
      Depth: "1",
      "Content-Type":
        "application/xml; charset=utf-8",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `iCloud calendar event query failed: ${response.status} ${response.statusText}`
    );
  }

  return response.text();
}

export async function createCalDavEvent(
  config: CalDavConfig,
  calendar: CalDavCalendar,
  input: {
    uid: string;
    title: string;
    start: Date;
    end: Date;
    description?: string;
    location?: string;
  }
): Promise<void> {
  const escape = (value: string) => value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Cosmic OS//EN", "BEGIN:VEVENT", `UID:${input.uid}`, `DTSTAMP:${formatCalDavDate(new Date())}`, `DTSTART:${formatCalDavDate(input.start)}`, `DTEND:${formatCalDavDate(input.end)}`, `SUMMARY:${escape(input.title)}`, ...(input.description ? [`DESCRIPTION:${escape(input.description)}`] : []), ...(input.location ? [`LOCATION:${escape(input.location)}`] : []), "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
  const response = await fetch(new URL(`${input.uid}.ics`, calendar.url), { method: "PUT", headers: { Authorization: "Basic " + Buffer.from(`${config.username}:${config.password}`).toString("base64"), "Content-Type": "text/calendar; charset=utf-8", "If-None-Match": "*" }, body: ics, cache: "no-store" });
  if (!response.ok) throw new Error("iCloud could not create the calendar event.");
}

function createEventCalendarData(input: {
  uid: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
}): string {
  const escape = (value: string) => value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Cosmic OS//EN", "BEGIN:VEVENT", `UID:${input.uid}`, `DTSTAMP:${formatCalDavDate(new Date())}`, `DTSTART:${formatCalDavDate(input.start)}`, `DTEND:${formatCalDavDate(input.end)}`, `SUMMARY:${escape(input.title)}`, ...(input.description ? [`DESCRIPTION:${escape(input.description)}`] : []), ...(input.location ? [`LOCATION:${escape(input.location)}`] : []), "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
}

export class CalDavConflictError extends Error {}

export async function updateCalDavEvent(
  config: CalDavConfig,
  resourceUrl: string,
  etag: string,
  input: {
    uid: string;
    title: string;
    start: Date;
    end: Date;
    description?: string;
    location?: string;
  }
): Promise<void> {
  const response = await fetch(resourceUrl, {
    method: "PUT",
    headers: {
      Authorization: "Basic " + Buffer.from(`${config.username}:${config.password}`).toString("base64"),
      "Content-Type": "text/calendar; charset=utf-8",
      "If-Match": etag,
    },
    body: createEventCalendarData(input),
    cache: "no-store",
  });

  if (response.status === 412) {
    throw new CalDavConflictError("This event changed in Calendar. Refresh and try again.");
  }

  if (!response.ok) {
    throw new Error("iCloud could not update the calendar event.");
  }
}

export async function deleteCalDavEvent(
  config: CalDavConfig,
  resourceUrl: string,
  etag: string
): Promise<void> {
  const response = await fetch(resourceUrl, {
    method: "DELETE",
    headers: {
      Authorization: "Basic " + Buffer.from(`${config.username}:${config.password}`).toString("base64"),
      "If-Match": etag,
    },
    cache: "no-store",
  });

  if (response.status === 412) {
    throw new CalDavConflictError("This event changed in Calendar. Refresh and try again.");
  }

  if (!response.ok) {
    throw new Error("iCloud could not delete the calendar event.");
  }
}
