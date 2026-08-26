"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSettingsData } from "@/components/apps/settings/SettingsProvider";
import { KIOSK_SESSION_STORAGE_KEY } from "@/components/os/kiosk/KioskShell";

export const AMBIENT_IDLE_TIMEOUT_MS = 5 * 60 * 1_000;

const POINTER_MOVE_THROTTLE_MS = 1_000;
const MINIMUM_DEV_IDLE_TIMEOUT_MS = 250;

function resolveIdleTimeout(configuredTimeout: number) {
  if (process.env.NODE_ENV !== "development") {
    return configuredTimeout;
  }

  const requested = Number(
    new URLSearchParams(window.location.search).get("ambientIdleMs"),
  );

  return Number.isFinite(requested) && requested >= MINIMUM_DEV_IDLE_TIMEOUT_MS
    ? requested
    : configuredTimeout;
}

export default function useIdleAmbient() {
  const router = useRouter();
  const settings = useSettingsData();
  const timerRef = useRef<number | null>(null);
  const navigatingRef = useRef(false);

  useEffect(() => {
    if (!settings.ready || !settings.data.ambient.enabled || settings.data.ambient.idleMinutes === null) {
      return;
    }
    const timeout = resolveIdleTimeout(settings.data.ambient.idleMinutes * 60_000);
    let lastPointerMove = 0;

    const clearTimer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const enterAmbient = () => {
      timerRef.current = null;

      if (document.hidden || navigatingRef.current) {
        return;
      }

      navigatingRef.current = true;
      const kioskSession = window.sessionStorage.getItem(KIOSK_SESSION_STORAGE_KEY) === "true";
      router.replace(kioskSession ? "/os/kiosk?cosmic-kiosk=1" : "/os/ambient");
    };

    const resetTimer = () => {
      if (document.hidden || navigatingRef.current) {
        return;
      }

      clearTimer();
      timerRef.current = window.setTimeout(enterAmbient, timeout);
    };

    const handlePointerMove = () => {
      const now = performance.now();

      if (now - lastPointerMove >= POINTER_MOVE_THROTTLE_MS) {
        lastPointerMove = now;
        resetTimer();
      }
    };

    const handleVisibilityChange = () => {
      clearTimer();

      if (!document.hidden) {
        navigatingRef.current = false;
        resetTimer();
      }
    };

    window.addEventListener("pointerdown", resetTimer, { capture: true, passive: true });
    window.addEventListener("touchstart", resetTimer, { capture: true, passive: true });
    window.addEventListener("keydown", resetTimer, { capture: true });
    window.addEventListener("wheel", resetTimer, { capture: true, passive: true });
    window.addEventListener("scroll", resetTimer, { capture: true, passive: true });
    window.addEventListener("pointermove", handlePointerMove, { capture: true, passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    resetTimer();

    return () => {
      clearTimer();
      window.removeEventListener("pointerdown", resetTimer, true);
      window.removeEventListener("touchstart", resetTimer, true);
      window.removeEventListener("keydown", resetTimer, true);
      window.removeEventListener("wheel", resetTimer, true);
      window.removeEventListener("scroll", resetTimer, true);
      window.removeEventListener("pointermove", handlePointerMove, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router, settings.data.ambient.enabled, settings.data.ambient.idleMinutes, settings.ready]);
}
