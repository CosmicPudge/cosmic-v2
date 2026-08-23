import { NextResponse } from "next/server";
import { getCurrentCosmicAccount } from "@/services/auth/server";
import { getCalendarEngineForRequest } from "@/services/calendar/accountProvider";

import type { CalendarDateRange } from "@/engines/calendar";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:5173",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(request: Request) {
  try {
    if (process.env.NODE_ENV === "production" && !(await getCurrentCosmicAccount(request))) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: corsHeaders });
    const account = await getCurrentCosmicAccount(request);
    const calendar = await getCalendarEngineForRequest(account?.id, new URL(request.url).searchParams.get("connectionId") ?? undefined);
    if (!calendar) return NextResponse.json({ nextEvent: null }, { headers: corsHeaders });

    const now = new Date();

    const end = new Date(
      now.getTime() + 7 * 24 * 60 * 60 * 1000,
    );

    const range: CalendarDateRange = {
      start: now,
      end,
    };

    const events =
      await calendar.engine.getEvents(range);

    const upcoming = events
      .filter((event) => {
        const start = new Date(event.start);

        return (
          !Number.isNaN(start.getTime()) &&
          start >= now
        );
      })
      .sort((a, b) => {
        return (
          new Date(a.start).getTime() -
          new Date(b.start).getTime()
        );
      });

    const nextEvent = upcoming[0];

    if (!nextEvent) {
      return NextResponse.json(
        {
          nextEvent: null,
        },
        {
          headers: corsHeaders,
        },
      );
    }

    const start =
      new Date(nextEvent.start);

    const minutesUntil = Math.max(
      0,
      Math.round(
        (start.getTime() - now.getTime()) /
          60_000,
      ),
    );

    return NextResponse.json(
      {
        nextEvent: {
          title: nextEvent.title,
          start: nextEvent.start,
          end: nextEvent.end,
          location:
            nextEvent.location ?? null,
          calendarName:
            nextEvent.calendarName ?? null,
          minutesUntil,
        },
      },
      {
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error(
      "Glasses Calendar Error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to load Cosmic Glasses calendar.",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
