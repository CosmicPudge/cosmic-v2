import {
  discoverCalDav,
  discoverCalendars,
} from "@/services/calendar/caldav";

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

    const discovery =
      await discoverCalDav(config);

    const calendars =
      await discoverCalendars(
        config,
        discovery.calendarHomeUrl
      );

    return Response.json({
      success: true,
      calendars: calendars.map((calendar) => ({
        displayName: calendar.displayName,
        supportedComponents: calendar.supportedComponents,
      })),
    });
  } catch (error) {
    console.error(
      "iCloud Calendar Discovery Error:",
      error
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to discover iCloud calendars.",
      },
      {
        status: 500,
      }
    );
  }
}
