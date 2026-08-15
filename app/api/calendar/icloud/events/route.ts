import {
  discoverCalDav,
  discoverCalendars,
  fetchCalendarEvents,
} from "@/services/calendar/caldav";
import { normalizeCalDavCalendarData } from "@/services/calendar/icalNormalizer";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return new Response(null, { status: 404 });
  }

  const username =
    process.env.APPLE_CALENDAR_USERNAME;
  const password =
    process.env.APPLE_CALENDAR_PASSWORD;
  const serverUrl =
    process.env.APPLE_CALENDAR_SERVER ??
    "https://caldav.icloud.com";

  if (!username || !password) {
    return Response.json(
      {
        error:
          "Apple Calendar credentials are not configured.",
      },
      {
        status: 500,
      }
    );
  }

  try {
    const config = {
      username,
      password,
      serverUrl,
    };
    const discovery = await discoverCalDav(config);
    const calendars = await discoverCalendars(
      config,
      discovery.calendarHomeUrl
    );
    const eventCalendars = calendars.filter((calendar) =>
      calendar.supportedComponents.includes("VEVENT")
    );
    const start = new Date();
    const end = new Date(start);

    end.setDate(end.getDate() + 30);

    const results = await Promise.all(
      eventCalendars.map(async (calendar) => {
        const rawResponse = await fetchCalendarEvents(
          config,
          calendar,
          start,
          end
        );
        const events = normalizeCalDavCalendarData(
          rawResponse,
          { calendarName: calendar.displayName },
          { start, end }
        );

        return {
          calendar: calendar.displayName,
          eventCount: events.length,
          hasRecurringEvents: events.some(
            (event) => event.isRecurring
          ),
          hasAllDayEvents: events.some(
            (event) => event.allDay
          ),
          events: events.map((event) => ({
            id: event.id,
            uid: event.uid,
            title: event.title,
            start: event.start.toISOString(),
            end: event.end.toISOString(),
            location: event.location,
            allDay: event.allDay,
          })),
        };
      })
    );

    return Response.json({
      success: true,
      window: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      calendars: results,
    });
  } catch (error) {
    console.error(
      "iCloud Calendar Event Query Error:",
      error
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to query iCloud calendar events.",
      },
      {
        status: 500,
      }
    );
  }
}
