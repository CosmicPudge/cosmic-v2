"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  CalendarEvent,
  CalendarSnapshot,
} from "@/core/contracts";
import { useVisiblePolling } from "@/hooks/useVisiblePolling";
import { kioskApiUrl } from "@/services/kioskRequest";
import { useEntitlements } from "@/hooks/os/useEntitlements";
import { useSchoolData } from "@/components/school/hooks/useSchoolData";
import { mergeSchoolCalendarSnapshot } from "@/services/calendar/schoolAdapter";

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
  timeZone?: string;
  accountCalendarConnected?: boolean;
  accountCalendarError?: boolean;
  sportsCalendarError?: boolean;
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
    ...(snapshot.timeZone ? { timeZone: snapshot.timeZone } : {}),
    ...(snapshot.accountCalendarConnected !== undefined ? { accountCalendarConnected: snapshot.accountCalendarConnected } : {}),
    ...(snapshot.accountCalendarError !== undefined ? { accountCalendarError: snapshot.accountCalendarError } : {}),
    ...(snapshot.sportsCalendarError !== undefined ? { sportsCalendarError: snapshot.sportsCalendarError } : {}),
  };
}

const DEFAULT_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

interface UseCalendarOptions {
  refreshMs?: number;
}

export default function useCalendar({ refreshMs = DEFAULT_REFRESH_INTERVAL_MS }: UseCalendarOptions = {}) {
  const { data: entitlements } = useEntitlements();
  const school = useSchoolData({ enabled: entitlements.features["school.basic"] });
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
          kioskApiUrl("/api/calendar"),
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Calendar is temporarily unavailable."
          );
        }

        let snapshot =
          hydrateSnapshot(
            await response.json()
          );
        if (school.snapshot) snapshot = mergeSchoolCalendarSnapshot(snapshot, school.snapshot);

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

    return () => {
      cancelled = true;
    };
  }, [school.snapshot]);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(kioskApiUrl("/api/calendar"), { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error("Calendar is temporarily unavailable.");
      let snapshot = hydrateSnapshot(await response.json());
      if (school.snapshot) snapshot = mergeSchoolCalendarSnapshot(snapshot, school.snapshot);
      setCalendar(snapshot);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown calendar error");
    }
  }, [school.snapshot]);

  useVisiblePolling(refresh, refreshMs, { immediate: false });

  return {
    calendar,
    loading: loading || school.loading,
    error,
  };
}
