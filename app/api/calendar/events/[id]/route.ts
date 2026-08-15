import {
  getAppleCalendarWriter,
  refreshAppleCalendarAfterWrite,
} from "@/core/serverCosmic";
import { CalDavConflictError } from "@/services/calendar/caldav";

const MAX_TITLE_LENGTH = 200;
const MAX_LOCATION_LENGTH = 300;
const MAX_DESCRIPTION_LENGTH = 4_000;

function optionalText(value: unknown, maxLength: number): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || value.length > maxLength) throw new Error("Invalid calendar event details.");
  return value.trim() || undefined;
}

function getEventId(context: { params: Promise<{ id: string }> }): Promise<string> {
  return context.params.then(({ id }) => id);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const id = await getEventId(context);
    const body = await request.json() as Record<string, unknown>;
    const title = optionalText(body.title, MAX_TITLE_LENGTH);
    const start = typeof body.start === "string" ? new Date(body.start) : new Date(NaN);
    const end = typeof body.end === "string" ? new Date(body.end) : new Date(NaN);

    if (!title || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return Response.json({ error: "Provide a title and valid event times." }, { status: 400 });
    }

    const writer = getAppleCalendarWriter();
    if (!writer) return Response.json({ error: "Calendar editing is not configured." }, { status: 403 });

    const event = await writer.updateEvent({
      eventId: id,
      title,
      start,
      end,
      ...(optionalText(body.location, MAX_LOCATION_LENGTH) ? { location: optionalText(body.location, MAX_LOCATION_LENGTH) } : {}),
      ...(optionalText(body.description, MAX_DESCRIPTION_LENGTH) ? { description: optionalText(body.description, MAX_DESCRIPTION_LENGTH) } : {}),
    });
    await refreshAppleCalendarAfterWrite();
    return Response.json({ event });
  } catch (error) {
    if (error instanceof CalDavConflictError) return Response.json({ error: error.message, conflict: true }, { status: 409 });
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update the calendar event." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const writer = getAppleCalendarWriter();
    if (!writer) return Response.json({ error: "Calendar editing is not configured." }, { status: 403 });
    await writer.deleteEvent({ eventId: await getEventId(context) });
    await refreshAppleCalendarAfterWrite();
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof CalDavConflictError) return Response.json({ error: error.message, conflict: true }, { status: 409 });
    return Response.json({ error: error instanceof Error ? error.message : "Unable to delete the calendar event." }, { status: 400 });
  }
}
