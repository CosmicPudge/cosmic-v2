import { serverCosmic } from "@/core/serverCosmic";
import type { CalendarDateRange } from "@/engines/calendar";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request
) {
  try {
    const url = new URL(
      request.url
    );

    const startParam =
      url.searchParams.get("start");

    const endParam =
      url.searchParams.get("end");

    /*
     * Explicit range request.
     *
     * Used by the full Calendar application.
     */
    if (startParam || endParam) {
      if (!startParam || !endParam) {
        return Response.json(
          {
            error:
              "Both start and end are required.",
          },
          {
            status: 400,
          }
        );
      }

      const start =
        new Date(startParam);

      const end =
        new Date(endParam);

      if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        end <= start
      ) {
        return Response.json(
          {
            error:
              "Invalid calendar date range.",
          },
          {
            status: 400,
          }
        );
      }

      const range: CalendarDateRange = {
        start,
        end,
      };

      const events =
        await serverCosmic.calendar.getEvents(
          range
        );

      return Response.json({
        events,
      });
    }

    /*
     * Existing dashboard behavior.
     */
    if (
      !serverCosmic.calendar.isReady()
    ) {
      await serverCosmic.calendar.initialize();
    }

    return Response.json(
      await serverCosmic.calendar.getSnapshot()
    );
  } catch (error) {
    console.error(
      "Calendar request failed:",
      error instanceof Error
        ? error.message
        : "Unknown calendar error"
    );

    return Response.json(
      {
        error:
          "Calendar is temporarily unavailable.",
      },
      {
        status: 503,
      }
    );
  }
}