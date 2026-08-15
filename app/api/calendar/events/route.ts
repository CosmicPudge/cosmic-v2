import {
  getAppleCalendarWriter,
  refreshAppleCalendarAfterWrite,
} from "@/core/serverCosmic";
import { CalendarDuplicateError } from "@/services/calendar/appleCalendarWriter";

export const dynamic = "force-dynamic";

const MAX_TITLE_LENGTH = 200;
const MAX_LOCATION_LENGTH = 300;
const MAX_DESCRIPTION_LENGTH = 4_000;

class CalendarValidationError extends Error {}

function optionalText(value: unknown, maxLength: number): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string" || value.length > maxLength) {
    throw new CalendarValidationError("Invalid calendar event details.");
  }

  return value.trim() || undefined;
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new CalendarValidationError("Invalid calendar event.");
    }

    const input = body as Record<string, unknown>;
    const title = optionalText(input.title, MAX_TITLE_LENGTH);
    const calendarId = optionalText(input.calendarId, 128);
    const start = typeof input.start === "string" ? new Date(input.start) : new Date(NaN);
    const end = typeof input.end === "string" ? new Date(input.end) : new Date(NaN);

    if (!title || !calendarId || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return Response.json({ error: "Provide a title, writable calendar, and valid event times." }, { status: 400 });
    }

    const writer = getAppleCalendarWriter();

    if (!writer) {
      return Response.json({ error: "Calendar creation is not configured." }, { status: 403 });
    }

    const event = await writer.createEvent({
      title,
      calendarId,
      start,
      end,
      ...(optionalText(input.location, MAX_LOCATION_LENGTH) ? { location: optionalText(input.location, MAX_LOCATION_LENGTH) } : {}),
      ...(optionalText(input.description, MAX_DESCRIPTION_LENGTH) ? { description: optionalText(input.description, MAX_DESCRIPTION_LENGTH) } : {}),
      confirmDuplicate: input.confirmDuplicate === true,
    });

    await refreshAppleCalendarAfterWrite();

    return Response.json({ event }, { status: 201 });
  } catch (error) {
    if (error instanceof CalendarValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof CalendarDuplicateError) {
      return Response.json(
        { error: error.message, duplicate: true },
        { status: 409 }
      );
    }

    console.error(
      "Calendar event creation failed:",
      error instanceof Error ? error.message : "Unknown calendar error"
    );

    return Response.json(
      { error: "Unable to create the calendar event." },
      { status: 500 }
    );
  }
}
