"use client";

import { useEffect, useRef } from "react";

interface UseVisiblePollingOptions {
  enabled?: boolean;
  immediate?: boolean;
}

/** Runs async work while visible and performs one catch-up run on return. */
export function useVisiblePolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  { enabled = true, immediate = true }: UseVisiblePollingOptions = {},
) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    let disposed = false;
    let timer: number | null = null;
    let inFlight = false;

    const clearTimer = () => {
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
    };

    const run = async () => {
      if (disposed || document.visibilityState !== "visible" || inFlight) return;
      inFlight = true;
      try {
        await callbackRef.current();
      } catch {
        // Polling callbacks own their user-facing error state.
      } finally {
        inFlight = false;
      }
    };

    const schedule = () => {
      clearTimer();
      if (disposed || document.visibilityState !== "visible") return;
      timer = window.setTimeout(async () => {
        await run();
        schedule();
      }, Math.max(250, intervalMs));
    };

    const handleVisibilityChange = () => {
      clearTimer();
      if (document.visibilityState === "visible") void run().finally(schedule);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    if (document.visibilityState === "visible") {
      if (immediate) void run().finally(schedule);
      else schedule();
    }

    return () => {
      disposed = true;
      clearTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, immediate, intervalMs]);
}
