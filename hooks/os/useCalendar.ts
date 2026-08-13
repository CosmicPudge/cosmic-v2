"use client";

import { useEffect, useState } from "react";

import { cosmic } from "@/core/CosmicCore";

import type { CalendarSnapshot } from "@/core/contracts";

export default function useCalendar() {
  const [calendar, setCalendar] =
    useState<CalendarSnapshot | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCalendar() {
      try {
        setLoading(true);
        setError(null);

        if (!cosmic.calendar.isReady()) {
          await cosmic.calendar.initialize();
        }

        const snapshot =
          await cosmic.calendar.getSnapshot();

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
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadCalendar();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    calendar,
    loading,
    error,
  };
}