"use client";

import { createContext, useContext } from "react";

import type { KioskSlideshowPauseReason } from "@/core/contracts/Kiosk";

export interface KioskEventAlertRequest { id: string; title: string; subtitle?: string; timingLabel?: string; }
export interface KioskMusicController { playing: boolean; pause: () => Promise<boolean>; play: () => Promise<boolean>; }

export interface KioskSlideshowControl {
  currentSlide: string | null;
  paused: boolean;
  pauseReason: KioskSlideshowPauseReason;
  pause: () => void;
  resume: () => void;
  togglePause: () => void;
  setMusicPlaying: (source: string, playing: boolean) => void;
  setMusicController: (source: string, controller: KioskMusicController | null) => void;
  requestEventAlert: (alert: KioskEventAlertRequest) => void;
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
    setMusicPlaying: () => undefined,
    setMusicController: () => undefined,
    requestEventAlert: () => undefined,
  } satisfies KioskSlideshowControl;
}
