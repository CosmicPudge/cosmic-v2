import type { CalendarDateRange } from "@/engines/calendar";
import { getCurrentCosmicAccount, kioskBootId } from "@/services/auth/server";
import { getCalendarEngineForRequest } from "@/services/calendar/accountProvider";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request
) {
  const account = await getCurrentCosmicAccount(request, { allowDevice: true, bootId: kioskBootId(request) });
  if (process.env.NODE_ENV === "production" && !account) return Response.json({ error: "Authentication required for private calendar access." }, { status: 401 });
  const calendar = await getCalendarEngineForRequest(account?.id, new URL(request.url).searchParams.get("connectionId") ?? undefined);
  if (!calendar) return Response.json({ error: "Calendar is not connected.", events: [] }, { status: 200 });
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
        await calendar.engine.getEvents(
          range
        );

      return Response.json({
        events,
      });
    }

    /*
     * Existing dashboard behavior.
     */
    return Response.json(
      await calendar.engine.getSnapshot()
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
