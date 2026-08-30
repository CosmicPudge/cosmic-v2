import type { CalendarDateRange } from "@/engines/calendar";
import type { CalendarEvent } from "@/core/contracts";
import { getCurrentCosmicSession, kioskBootId } from "@/services/auth/server";
import { getCalendarEngineForRequest } from "@/services/calendar/accountProvider";
import { buildKioskCalendarSnapshot, mergeCalendarEvents, sportsEventsForRange } from "@/services/calendar/sportsCalendar";
import { getSportsSnapshot } from "@/services/sports/snapshot";
import { getAccountPreferences } from "@/services/settings/accountPreferences";
import { referencePreferences } from "@/services/settings/preferences";
import { readKioskDeviceProfile } from "@/services/devices/kioskProfile";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request
) {
  const url = new URL(request.url);
  const isKiosk = url.searchParams.get("cosmic-kiosk") === "1";
  const session = await getCurrentCosmicSession(request, { allowDevice: true, bootId: kioskBootId(request) });
  const account = session?.account;
  if (process.env.NODE_ENV === "production" && !account) return Response.json({ error: "Authentication required for private calendar access." }, { status: 401 });
  let calendar: Awaited<ReturnType<typeof getCalendarEngineForRequest>> = null;
  let accountCalendarError = false;
  try {
    calendar = await getCalendarEngineForRequest(account?.id, url.searchParams.get("connectionId") ?? undefined);
  } catch {
    accountCalendarError = true;
  }
  try {
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

      let privateEvents: CalendarEvent[] = [];
      if (calendar) {
        try { privateEvents = await calendar.engine.getEvents(range); }
        catch { accountCalendarError = true; }
      }
      let sportsEvents: CalendarEvent[] = [];
      let sportsCalendarError = false;
      if (account) {
        try {
          const preferences = process.env.DATABASE_URL ? await getAccountPreferences(account.id) : referencePreferences;
          sportsEvents = sportsEventsForRange(await getSportsSnapshot(new Date(), preferences), range);
        } catch { sportsCalendarError = true; }
      }

      return Response.json({
        events: mergeCalendarEvents([...privateEvents, ...sportsEvents]),
        ...(sportsCalendarError ? { sportsCalendarError: true } : {}),
        ...(accountCalendarError ? { accountCalendarError: true } : {}),
      });
    }

    if (!isKiosk) {
      if (!calendar) return Response.json({ error: "Calendar is not connected.", events: [] }, { status: 200 });
      return Response.json(await calendar.engine.getSnapshot());
    }

    let accountEvents: CalendarEvent[] = [];
    if (calendar) {
      try { accountEvents = await calendar.engine.getEvents(); }
      catch { accountCalendarError = true; }
    }
    let sports = null;
    let sportsCalendarError = false;
    if (account) {
      try {
        const preferences = process.env.DATABASE_URL ? await getAccountPreferences(account.id) : referencePreferences;
        sports = await getSportsSnapshot(new Date(), preferences);
      } catch { sportsCalendarError = true; /* Sports are optional and must not take down account Calendar. */ }
    }
    let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (session?.sessionType === "device" && session.deviceId) {
      try { timeZone = (await readKioskDeviceProfile(session.deviceId))?.effectiveTimezone ?? timeZone; }
      catch { /* The fallback timezone is the browser/server timezone. */ }
    }
    return Response.json(buildKioskCalendarSnapshot(accountEvents, sports, new Date(), timeZone, Boolean(calendar), accountCalendarError, sportsCalendarError));
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
