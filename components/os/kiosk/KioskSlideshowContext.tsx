"use client";

import { createContext, useContext } from "react";

import type { KioskSlideshowPauseReason } from "@/core/contracts/Kiosk";

export interface KioskSlideshowControl {
  currentSlide: string | null;
  paused: boolean;
  pauseReason: KioskSlideshowPauseReason;
  pause: () => void;
  resume: () => void;
  togglePause: () => void;
}

const KioskSlideshowContext = createContext<KioskSlideshowControl | null>(null);

export const KioskSlideshowProvider = KioskSlideshowContext.Provider;

export function useKioskSlideshowControl() {
  return useContext(KioskSlideshowContext) ?? {
    currentSlide: null,
    paused: false,
    pauseReason: null,
    pause: () => undefined,
    resume: () => undefined,
    togglePause: () => undefined,
  } satisfies KioskSlideshowControl;
}
