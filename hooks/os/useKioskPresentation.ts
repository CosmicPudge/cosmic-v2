"use client";

import { useEffect } from "react";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSettingsData } from "@/components/apps/settings/SettingsProvider";
import { useKioskPresentationStore } from "@/stores/kioskPresentationStore";
import { isKioskExitControlTarget, resolveKioskIdleTimeout, shouldWakeDesktopKiosk } from "./kioskPresentationLifecycle";

const POINTER_MOVE_THROTTLE_MS = 1_000;
function resolveIdleTimeout(configuredTimeout: number) {
  if (process.env.NODE_ENV !== "development") return configuredTimeout;
  const requested = Number(new URLSearchParams(window.location.search).get("ambientIdleMs"));
  return resolveKioskIdleTimeout(configuredTimeout, Number.isNaN(requested) ? null : requested, true);
}

export function useKioskPresentation() {
  const router = useRouter();
  const active = useKioskPresentationStore((state) => state.active);
  const entry = useKioskPresentationStore((state) => state.entry);
  const enterManualState = useKioskPresentationStore((state) => state.enterManual);
  const exitState = useKioskPresentationStore((state) => state.exit);
  const enterManual = useCallback(() => {
    enterManualState();
    router.push("/kiosk");
  }, [enterManualState, router]);
  const exit = useCallback(() => {
    exitState();
    if (window.location.pathname === "/kiosk") router.replace("/os");
  }, [exitState, router]);
  return { active, entry, enterManual, exit };
}

export default function useKioskPresentationLifecycle() {
  const router = useRouter();
  const settings = useSettingsData();
  const active = useKioskPresentationStore((state) => state.active);
  const entry = useKioskPresentationStore((state) => state.entry);
  const enterIdle = useKioskPresentationStore((state) => state.enterIdle);
  const exit = useKioskPresentationStore((state) => state.exit);
  const enterIdleKiosk = useCallback(() => {
    enterIdle();
    router.replace("/kiosk");
  }, [enterIdle, router]);

  useEffect(() => {
    if (!settings.ready || !settings.data.ambient.enabled || settings.data.ambient.idleMinutes === null) return;

    const timeout = resolveIdleTimeout(settings.data.ambient.idleMinutes * 60_000);
    let timer: number | null = null;
    let lastPointerMove = 0;

    const clearTimer = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
    };
    const resetTimer = () => {
      if (document.hidden || useKioskPresentationStore.getState().active) return;
      clearTimer();
      timer = window.setTimeout(enterIdleKiosk, timeout);
    };
    const wake = (event: Event) => {
      const isExitControl = isKioskExitControlTarget(event.target);
      const state = useKioskPresentationStore.getState();
      if (!state.active) {
        resetTimer();
        return;
      }
      if (isExitControl) return;
      if (state.entry === "manual") {
        if (event.type === "keydown" && (event as KeyboardEvent).key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          exit();
        } else if (event.type !== "pointermove") {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }
      if (!shouldWakeDesktopKiosk(state.active, false, state.entry ?? "idle")) {
        resetTimer();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      exit();
    };
    const handlePointerMove = () => {
      const state = useKioskPresentationStore.getState();
      if (state.active && state.entry === "idle") {
        exit();
        return;
      }
      if (state.active) return;
      const now = performance.now();
      if (now - lastPointerMove >= POINTER_MOVE_THROTTLE_MS) {
        lastPointerMove = now;
        resetTimer();
      }
    };
    const handleVisibilityChange = () => {
      clearTimer();
      if (!document.hidden) resetTimer();
    };

    window.addEventListener("pointerdown", wake, { capture: true, passive: false });
    window.addEventListener("touchstart", wake, { capture: true, passive: false });
    window.addEventListener("keydown", wake, { capture: true, passive: false });
    window.addEventListener("wheel", wake, { capture: true, passive: false });
    window.addEventListener("scroll", wake, { capture: true, passive: false });
    window.addEventListener("pointermove", handlePointerMove, { capture: true, passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    resetTimer();

    return () => {
      clearTimer();
      window.removeEventListener("pointerdown", wake, true);
      window.removeEventListener("touchstart", wake, true);
      window.removeEventListener("keydown", wake, true);
      window.removeEventListener("wheel", wake, true);
      window.removeEventListener("scroll", wake, true);
      window.removeEventListener("pointermove", handlePointerMove, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enterIdleKiosk, exit, entry, settings.data.ambient.enabled, settings.data.ambient.idleMinutes, settings.ready]);

  useEffect(() => {
    if (!active) return;
    const onExit = (event: KeyboardEvent) => {
      if (event.key === "Escape") exit();
    };
    window.addEventListener("keydown", onExit);
    return () => window.removeEventListener("keydown", onExit);
  }, [active, exit]);
}
