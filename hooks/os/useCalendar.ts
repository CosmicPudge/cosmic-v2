"use client";

import { useEffect, useState } from "react";

import type {
  CalendarEvent,
  CalendarSnapshot,
} from "@/core/contracts";

interface CalendarResponse {
  today: Array<Omit<CalendarEvent, "start" | "end"> & {
    start: string;
    end: string;
  }>;

  upcoming: Array<
    Omit<CalendarEvent, "start" | "end"> & {
      start: string;
      end: string;
    }
  >;

  currentEvent?: Omit<CalendarEvent, "start" | "end"> & {
    start: string;
    end: string;
  };

  nextEvent?: Omit<CalendarEvent, "start" | "end"> & {
    start: string;
    end: string;
  };
}

function hydrateEvent(
  event: CalendarResponse["today"][number]
): CalendarEvent {
  return {
    ...event,
    start: new Date(event.start),
    end: new Date(event.end),
  };
}

function hydrateSnapshot(
  snapshot: CalendarResponse
): CalendarSnapshot {
  return {
    today: snapshot.today.map(hydrateEvent),
    upcoming: snapshot.upcoming.map(hydrateEvent),
    ...(snapshot.currentEvent
      ? {
          currentEvent: hydrateEvent(
            snapshot.currentEvent
          ),
        }
      : {}),
    ...(snapshot.nextEvent
      ? {
          nextEvent: hydrateEvent(
            snapshot.nextEvent
          ),
        }
      : {}),
  };
}

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export default function useCalendar() {
  const [calendar, setCalendar] =
    useState<CalendarSnapshot | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCalendar(
      showLoading = false
    ) {
      try {
        if (showLoading) {
          setLoading(true);
        }

        setError(null);

        const response = await fetch(
          "/api/calendar",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Calendar is temporarily unavailable."
          );
        }

        const snapshot =
          hydrateSnapshot(
            await response.json()
          );

        if (!cancelled) {
          setCalendar(snapshot);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unknown calendar error"
          );
        }
      } finally {
        if (
          !cancelled &&
          showLoading
        ) {
          setLoading(false);
        }
      }
    }

    void loadCalendar(true);

    const interval = window.setInterval(
      () => {
        void loadCalendar(false);
      },
      REFRESH_INTERVAL_MS
    );

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return {
    calendar,
    loading,
    error,
  };
}
