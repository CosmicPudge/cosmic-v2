"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

import { dashboardWidgets } from "@/config/widgets";
import { WIDGET_REGISTRY } from "@/components/dashboard/layout/widgetRegistry";
import { useSports } from "@/hooks/os/useSports";
import type {
  SportKind,
  SportsEvent,
} from "@/core/contracts/Sports";

import KioskSlide from "./KioskSlide";
import { useKioskAmbientFrame } from "./KioskAmbientFrame";
import KioskSportsOverride from "./KioskSportsOverride";

import {
  selectKioskLiveEvent,
} from "./kioskSports";

import {
  KIOSK_SLIDE_DURATION_MS,
  KIOSK_TRANSITION_DURATION_MS,
} from "./kioskConfig";
import { KioskSlideshowProvider } from "./KioskSlideshowContext";
import type { KioskSlideshowPauseReason } from "@/core/contracts/Kiosk";

const TEST_SPORTS: SportKind[] = [
  "nfl",
  "mlb",
  "f1",
  "nascar",
];

function isTestSport(
  value: string | null,
): value is SportKind {
  return (
    value !== null &&
    TEST_SPORTS.includes(value as SportKind)
  );
}

function createTestEvent(
  sport: SportKind,
): SportsEvent {
  const now = new Date();

  switch (sport) {
    case "nfl":
      return {
        id: "kiosk-test-nfl",
        sport: "nfl",
        title: "Green Bay Packers vs Chicago Bears",
        start: now,
        status: "live",
        statusDetail: "3rd Quarter · 4:22",
        awayTeam: {
          name: "Chicago Bears",
          abbreviation: "CHI",
          score: 17,
        },
        homeTeam: {
          name: "Green Bay Packers",
          abbreviation: "GB",
          score: 24,
        },
        venue: "Lambeau Field",
        broadcast: "Kiosk Test",
        source: "kiosk-test",
      };

    case "mlb":
      return {
        id: "kiosk-test-mlb",
        sport: "mlb",
        title: "Cleveland Guardians vs Los Angeles Angels",
        start: now,
        status: "live",
        statusDetail: "Top 10th · 1 Out",
        awayTeam: {
          name: "Cleveland Guardians",
          abbreviation: "CLE",
          score: 8,
        },
        homeTeam: {
          name: "Los Angeles Angels",
          abbreviation: "LAA",
          score: 6,
        },
        venue: "Angel Stadium",
        broadcast: "Kiosk Test",
        source: "kiosk-test",
      };

    case "f1":
      return {
        id: "kiosk-test-f1",
        sport: "f1",
        title: "Formula 1 Grand Prix",
        start: now,
        status: "live",
        statusDetail: "Lap 38 / 57",
        venue: "Kiosk Test Circuit",
        broadcast: "Kiosk Test",
        source: "kiosk-test",
        metadata: {
          sessionType: "Race",
          sessionKind: "race",
          track: "Kiosk Test Circuit",
        },
      };

    case "nascar":
      return {
        id: "kiosk-test-nascar",
        sport: "nascar",
        title: "NASCAR Cup Series",
        start: now,
        status: "live",
        statusDetail: "Lap 167 / 267 · Stage 3",
        venue: "Kiosk Test Speedway",
        broadcast: "Kiosk Test",
        source: "kiosk-test",
        metadata: {
          sessionType: "Race",
          track: "Kiosk Test Speedway",
        },
      };

    default:
      throw new Error(
        "Unsupported kiosk test sport.",
      );
  }
}

export default function KioskSlideshow() {
  const searchParams = useSearchParams();
  const { setPersistentClockHidden } = useKioskAmbientFrame();

  const { data: sportsData } = useSports({
    refreshMs: (snapshot) => snapshot?.live.length ? 10_000 : 60_000,
  });

  const widgets = useMemo(() => {
    return dashboardWidgets
      .filter((widget) =>
        WIDGET_REGISTRY.some(
          (entry) =>
            entry.id === widget.id &&
            entry.enabled,
        ),
      )
      .sort(
        (a, b) =>
          a.priority - b.priority,
      );
  }, []);

  const testSportParam = searchParams.get("simulate-sport") ?? searchParams.get("kiosk-sport-test");

  const testModeAllowed =
    process.env.NODE_ENV !== "production";

  const testLiveEvent =
    useMemo(() => {
      if (!testModeAllowed) {
        return null;
      }

      if (
        testSportParam === "none"
      ) {
        return null;
      }

      if (
        !isTestSport(
          testSportParam,
        )
      ) {
        return null;
      }

      return createTestEvent(
        testSportParam,
      );
    }, [
      testModeAllowed,
      testSportParam,
    ]);

  const liveEvent = useMemo(() => {
    if (
      testModeAllowed &&
      testSportParam === "none"
    ) {
      return null;
    }

    if (testLiveEvent) {
      return testLiveEvent;
    }

    if (!sportsData) {
      return null;
    }

    return selectKioskLiveEvent(
      sportsData.live,
    );
  }, [
    sportsData,
    testLiveEvent,
    testModeAllowed,
    testSportParam,
  ]);

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [
    previousIndex,
    setPreviousIndex,
  ] = useState<number | null>(null);

  const intervalRef = useRef<number | null>(null);
  const transitionTimeoutRef = useRef<number | null>(null);
  const transitionLockRef = useRef(false);
  const gestureRef = useRef<{ pointerId: number; startX: number; startY: number; lastX: number; lastY: number } | null>(null);
  const [timerEpoch, setTimerEpoch] = useState(0);
  const [manualPaused, setManualPaused] = useState(false);
  const [holdMusicWhilePlaying, setHoldMusicWhilePlaying] = useState(false);
  const [musicSources, setMusicSources] = useState<Record<string, boolean>>({});
  const appliedCommandRevisionRef = useRef(0);
  const bootId = searchParams.get("cosmic-boot")?.trim() ?? "";
  const setMusicPlaying = useCallback((source: string, playing: boolean) => {
    setMusicSources((current) => current[source] === playing ? current : { ...current, [source]: playing });
  }, []);
  const musicPlaying = Object.values(musicSources).some(Boolean);
  const musicHold = holdMusicWhilePlaying && musicPlaying;
  const paused = manualPaused || musicHold;
  const pauseReason: KioskSlideshowPauseReason = manualPaused ? "manual" : musicHold ? "music-playing" : null;
  const pause = useCallback(() => { setManualPaused(true); }, []);
  const resume = useCallback(() => { setManualPaused(false); setTimerEpoch((epoch) => epoch + 1); }, []);
  const togglePause = useCallback(() => { setManualPaused((current) => !current); setTimerEpoch((epoch) => epoch + 1); }, []);
  const safeCurrentIndex = widgets.length > 0
    ? Math.min(currentIndex, widgets.length - 1)
    : 0;
  const safePreviousIndex = previousIndex !== null && previousIndex < widgets.length
    ? previousIndex
    : null;
  const currentWidget = widgets[safeCurrentIndex];

  const goToRelativeSlide = useCallback((direction: 1 | -1, resetTimer: boolean) => {
    if (liveEvent || widgets.length <= 1 || transitionLockRef.current) return false;

    transitionLockRef.current = true;
    setCurrentIndex((current) => {
      const from = Math.min(Math.max(current, 0), widgets.length - 1);
      const to = (from + direction + widgets.length) % widgets.length;
      setPreviousIndex(from);
      if (process.env.NODE_ENV !== "production") console.info(`[kiosk-swipe] ${direction === 1 ? "left next" : "right previous"}`);
      return to;
    });
    if (resetTimer) setTimerEpoch((epoch) => epoch + 1);
    if (transitionTimeoutRef.current !== null) window.clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = window.setTimeout(() => {
      setPreviousIndex(null);
      transitionLockRef.current = false;
      transitionTimeoutRef.current = null;
    }, KIOSK_TRANSITION_DURATION_MS);
    return true;
  }, [liveEvent, widgets.length]);

  useEffect(() => {
    if (liveEvent || paused) {
      return;
    }

    if (widgets.length <= 1) {
      return;
    }

    intervalRef.current =
      window.setInterval(() => {
        goToRelativeSlide(1, false);
      }, KIOSK_SLIDE_DURATION_MS);

    if (process.env.NODE_ENV !== "production") console.info("[kiosk-slideshow] interval-start");

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (process.env.NODE_ENV !== "production") console.info("[kiosk-slideshow] interval-stop");
    };
  }, [
    liveEvent,
    paused,
    goToRelativeSlide,
    timerEpoch,
    widgets.length,
  ]);

  useEffect(() => () => {
    if (transitionTimeoutRef.current !== null) window.clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = null;
    transitionLockRef.current = false;
  }, []);

  const stateRef = useRef({ currentSlide: "", paused, pauseReason });
  useEffect(() => {
    stateRef.current = { currentSlide: currentWidget?.id ?? "", paused, pauseReason };
  }, [currentWidget?.id, paused, pauseReason]);

  useEffect(() => {
    if (!bootId) return;
    let cancelled = false;
    const sync = async () => {
      try {
        const response = await fetch(`/api/devices/kiosk-control?cosmic-kiosk=1&cosmic-boot=${encodeURIComponent(bootId)}`, { cache: "no-store", credentials: "include" });
        if (!response.ok || cancelled) return;
        const state = await response.json() as { paused: boolean; pauseReason: KioskSlideshowPauseReason; holdMusicWhilePlaying: boolean; command?: "pause" | "resume" | "next" | "previous" | null; commandRevision: number; appliedCommandRevision: number };
        setHoldMusicWhilePlaying(state.holdMusicWhilePlaying);
        let nextPaused = stateRef.current.paused;
        let nextReason = stateRef.current.pauseReason;
        if (state.pauseReason === "manual" || (state.pauseReason === null && state.command === "resume")) {
          nextPaused = state.paused;
          nextReason = state.pauseReason;
          setManualPaused(state.paused && state.pauseReason === "manual");
        }
        if (state.command && state.commandRevision > appliedCommandRevisionRef.current && state.commandRevision > state.appliedCommandRevision) {
          appliedCommandRevisionRef.current = state.commandRevision;
          if (state.command === "pause") { nextPaused = true; nextReason = "manual"; setManualPaused(true); }
          if (state.command === "resume") { nextPaused = false; nextReason = null; setManualPaused(false); setTimerEpoch((epoch) => epoch + 1); }
          if (state.command === "next") goToRelativeSlide(1, true);
          if (state.command === "previous") goToRelativeSlide(-1, true);
        } else {
          appliedCommandRevisionRef.current = Math.max(appliedCommandRevisionRef.current, state.appliedCommandRevision);
        }
        await fetch(`/api/devices/kiosk-control?cosmic-kiosk=1&cosmic-boot=${encodeURIComponent(bootId)}`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ action: "report", currentSlide: stateRef.current.currentSlide, paused: nextPaused, pauseReason: nextReason, appliedCommandRevision: appliedCommandRevisionRef.current }) });
      } catch { /* A transient control failure must not interrupt the kiosk. */ }
    };
    void sync();
    const interval = window.setInterval(() => void sync(), 1500);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [bootId, goToRelativeSlide]);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (liveEvent || widgets.length <= 1 || (event.pointerType === "mouse" && event.button !== 0)) return;
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [liveEvent, widgets.length]);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gesture.lastX = event.clientX;
    gesture.lastY = event.clientY;
  }, []);

  const finishPointerGesture = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gestureRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);

    const deltaX = gesture.lastX - gesture.startX;
    const deltaY = gesture.lastY - gesture.startY;
    const threshold = Math.max(50, window.innerWidth * 0.05);
    if (Math.abs(deltaX) <= Math.abs(deltaY) || Math.abs(deltaX) < threshold) return;
    goToRelativeSlide(deltaX < 0 ? 1 : -1, true);
  }, [goToRelativeSlide]);

  useEffect(() => {
    setPersistentClockHidden(!liveEvent && currentWidget?.id === "clock");
    return () => setPersistentClockHidden(false);
  }, [currentWidget?.id, liveEvent, setPersistentClockHidden]);

  if (liveEvent) {
    return (
      <KioskSportsOverride
        event={liveEvent}
      />
    );
  }

  if (widgets.length === 0) {
    return (
      <div className="grid min-h-[100dvh] place-items-center px-6 text-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-100/45">
            Cosmic Kiosk
          </p>

          <h1 className="mt-3 text-3xl font-bold text-white/90">
            No kiosk slides available
          </h1>

          <p className="mt-2 text-sm text-white/40">
            Enable at least one
            dashboard widget.
          </p>
        </div>
      </div>
    );
  }

  const previousWidget = safePreviousIndex !== null ? widgets[safePreviousIndex] : null;

  if (process.env.NODE_ENV !== "production" && searchParams.get("cosmic-test-crash") === "root") {
    throw new Error("Development kiosk root crash test");
  }

  if (!currentWidget) {
    return null;
  }

  const control = { currentSlide: currentWidget.id, paused, pauseReason, pause, resume, togglePause, setMusicPlaying };
  return (
    <KioskSlideshowProvider value={control}>
    <div
      className="kiosk-slideshow absolute inset-0 h-[100dvh] w-[100dvw] overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointerGesture}
      onPointerCancel={finishPointerGesture}
      style={{ touchAction: "pan-y" }}
      aria-label="Cosmic kiosk slideshow"
    >
      {previousWidget ? (
        <KioskSlide
          key={`previous-${previousWidget.id}-${safePreviousIndex}`}
          widget={previousWidget}
          active={false}
          exiting
        />
      ) : null}

      <KioskSlide
        key={`current-${currentWidget.id}-${currentIndex}`}
        widget={currentWidget}
        active
        exiting={false}
      />

      <span className="sr-only" aria-live="polite">Current kiosk scene: {currentWidget.id}</span>
      {paused ? <span className="pointer-events-none absolute right-5 top-5 z-30 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/65 backdrop-blur-sm">Paused</span> : null}
    </div>
    </KioskSlideshowProvider>
  );
}
