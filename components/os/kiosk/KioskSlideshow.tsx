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
import KioskSceneFrame from "@/components/os/widgets/shared/KioskSceneFrame";

import {
  selectKioskLiveEvent,
} from "./kioskSports";

import {
  KIOSK_SLIDE_DURATION_MS,
  KIOSK_TRANSITION_DURATION_MS,
} from "./kioskConfig";
import { KioskSlideshowProvider } from "./KioskSlideshowContext";
import type { KioskSlideshowPauseReason } from "@/core/contracts/Kiosk";
import { useEntitlements } from "@/hooks/os/useEntitlements";
import { resolveKioskSwipeDirection, shouldResetKioskRotationAfterSwipe } from "./kioskSlideshowInteraction";
import { createKioskSportsTestEvent, parseKioskSportsTestOverride } from "./kioskSportsTestOverride";
import { KIOSK_MUSIC_PLAYBACK_STALE_MS, shouldPauseKioskForMusic } from "./kioskMusicRotation";

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

type SportsPresentationState = {
  event: SportsEvent;
  phase: "entering" | "active" | "exiting";
};

export default function KioskSlideshow() {
  const searchParams = useSearchParams();
  const sponsorDemo = process.env.NODE_ENV !== "production" && searchParams.get("kioskDemo") === "sponsor";
  return sponsorDemo ? <KioskSponsorDemo /> : <KioskNormalSlideshow />;
}

function KioskNormalSlideshow() {
  const searchParams = useSearchParams();
  const { setPersistentClockHidden } = useKioskAmbientFrame();
  const { data: entitlements } = useEntitlements();
  const standaloneDeveloperKiosk = typeof window !== "undefined" && window.location.pathname === "/kiosk";
  const manualSportsOverride = useMemo(() => parseKioskSportsTestOverride(searchParams, typeof window !== "undefined" ? window.location.hostname : "", typeof window !== "undefined" ? window.location.pathname : "") , [searchParams]);

  const { data: sportsData } = useSports({
    refreshMs: (snapshot) => snapshot?.live.length ? 10_000 : 60_000,
  });

  const widgets = useMemo(() => {
    const developerOrder = ["clock", "weather", "calendar", "school", "sports", "music", "notifications", "system"];
    return dashboardWidgets
      .filter((widget) => (standaloneDeveloperKiosk ? developerOrder.includes(widget.id) : (widget.id !== "school" || entitlements.features["school.basic"])) &&
        WIDGET_REGISTRY.some(
          (entry) =>
            entry.id === widget.id &&
            entry.enabled,
        ),
      )
      .sort((a, b) => standaloneDeveloperKiosk ? developerOrder.indexOf(a.id) - developerOrder.indexOf(b.id) : a.priority - b.priority);
  }, [entitlements.features, standaloneDeveloperKiosk]);

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
    if (manualSportsOverride) return createKioskSportsTestEvent(manualSportsOverride);
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
    manualSportsOverride,
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
  const [musicSources, setMusicSources] = useState<Record<string, { playing: boolean; lastSeenAt: number }>>({});
  const musicSourceTimersRef = useRef<Record<string, number>>({});
  // Presentation-only phases keep a sports eligibility refresh from hard-swapping the scene tree.
  const [sportsPresentation, setSportsPresentation] = useState<SportsPresentationState | null>(null);
  const sportsPresentationTransitionRef = useRef<number | null>(null);
  const appliedCommandRevisionRef = useRef(0);
  const bootId = searchParams.get("cosmic-boot")?.trim() ?? "";
  const setMusicPlaying = useCallback((source: string, playing: boolean) => {
    const lastSeenAt = Date.now();
    const existingTimer = musicSourceTimersRef.current[source];
    if (existingTimer !== undefined) window.clearTimeout(existingTimer);
    if (playing) {
      musicSourceTimersRef.current[source] = window.setTimeout(() => {
        setMusicSources((current) => current[source]?.lastSeenAt === lastSeenAt ? { ...current, [source]: { playing: false, lastSeenAt } } : current);
        delete musicSourceTimersRef.current[source];
      }, KIOSK_MUSIC_PLAYBACK_STALE_MS);
    } else {
      delete musicSourceTimersRef.current[source];
    }
    setMusicSources((current) => current[source]?.playing === playing && current[source]?.lastSeenAt === lastSeenAt ? current : { ...current, [source]: { playing, lastSeenAt } });
  }, []);
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
  const musicPlayingSource = Object.values(musicSources).find((source) => source.playing);
  const musicHold = standaloneDeveloperKiosk
    ? shouldPauseKioskForMusic({ standalone: true, scene: currentWidget?.id, playing: Boolean(musicPlayingSource), lastSeenAt: musicPlayingSource?.lastSeenAt })
    : holdMusicWhilePlaying && Boolean(musicPlayingSource);
  const paused = manualPaused || musicHold;
  const pauseReason: KioskSlideshowPauseReason = manualPaused ? "manual" : musicHold ? "music-playing" : null;

  const goToRelativeSlide = useCallback((direction: 1 | -1, resetTimer: boolean) => {
    if (liveEvent || sportsPresentation || widgets.length <= 1 || transitionLockRef.current) return false;

    transitionLockRef.current = true;
    setCurrentIndex((current) => {
      const from = Math.min(Math.max(current, 0), widgets.length - 1);
      const to = (from + direction + widgets.length) % widgets.length;
      setPreviousIndex(from);
      if (process.env.NODE_ENV !== "production") console.info(`[kiosk-swipe] ${direction === 1 ? "left next" : "right previous"}`);
      return to;
    });
    if (resetTimer && shouldResetKioskRotationAfterSwipe()) setTimerEpoch((epoch) => epoch + 1);
    if (transitionTimeoutRef.current !== null) window.clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = window.setTimeout(() => {
      setPreviousIndex(null);
      transitionLockRef.current = false;
      transitionTimeoutRef.current = null;
    }, KIOSK_TRANSITION_DURATION_MS);
    return true;
  }, [liveEvent, sportsPresentation, widgets.length]);

  useEffect(() => {
    const syncTimeout = window.setTimeout(() => {
      if (liveEvent) {
        setSportsPresentation((current) => {
          if (!current) return { event: liveEvent, phase: "entering" };
          if (current.phase === "exiting") return { event: liveEvent, phase: "entering" };
          return current.event.id === liveEvent.id
            ? current
            : { event: liveEvent, phase: current.phase };
        });
      } else {
        setSportsPresentation((current) => {
          if (!current || current.phase === "exiting") return current;
          return { ...current, phase: "exiting" };
        });
      }
    }, 0);

    return () => window.clearTimeout(syncTimeout);
  }, [liveEvent]);

  useEffect(() => {
    if (!sportsPresentation) return;

    if (sportsPresentationTransitionRef.current !== null) {
      window.clearTimeout(sportsPresentationTransitionRef.current);
      sportsPresentationTransitionRef.current = null;
    }

    if (sportsPresentation.phase === "entering") {
      sportsPresentationTransitionRef.current = window.setTimeout(() => {
        setSportsPresentation((current) => current?.phase === "entering" ? { ...current, phase: "active" } : current);
        sportsPresentationTransitionRef.current = null;
      }, KIOSK_TRANSITION_DURATION_MS);
    } else if (sportsPresentation.phase === "exiting") {
      sportsPresentationTransitionRef.current = window.setTimeout(() => {
        setSportsPresentation(null);
        sportsPresentationTransitionRef.current = null;
      }, KIOSK_TRANSITION_DURATION_MS);
    }

    return () => {
      if (sportsPresentationTransitionRef.current !== null) {
        window.clearTimeout(sportsPresentationTransitionRef.current);
        sportsPresentationTransitionRef.current = null;
      }
    };
  }, [sportsPresentation]);

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
    if (sportsPresentationTransitionRef.current !== null) window.clearTimeout(sportsPresentationTransitionRef.current);
    sportsPresentationTransitionRef.current = null;
    Object.values(musicSourceTimersRef.current).forEach((timer) => window.clearTimeout(timer));
    musicSourceTimersRef.current = {};
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
    if (liveEvent || sportsPresentation || widgets.length <= 1 || (event.pointerType === "mouse" && event.button !== 0)) return;
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [liveEvent, sportsPresentation, widgets.length]);

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
    const direction = resolveKioskSwipeDirection(deltaX, deltaY, threshold);
    if (direction === null) return;
    goToRelativeSlide(direction, true);
  }, [goToRelativeSlide]);

  useEffect(() => {
    setPersistentClockHidden(!liveEvent && !sportsPresentation && currentWidget?.id === "clock");
    return () => setPersistentClockHidden(false);
  }, [currentWidget?.id, liveEvent, setPersistentClockHidden, sportsPresentation]);

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
      <div className={`kiosk-sports-transition-layer kiosk-sports-transition-normal ${sportsPresentation ? `kiosk-sports-transition-normal-${sportsPresentation.phase}` : ""}`}>
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
      </div>

      {sportsPresentation ? (
        <div className={`kiosk-sports-transition-layer kiosk-sports-transition-sports kiosk-sports-transition-sports-${sportsPresentation.phase}`} aria-hidden={sportsPresentation.phase !== "active"}>
          <KioskSportsOverride event={sportsPresentation.event} />
        </div>
      ) : null}

      <span className="sr-only" aria-live="polite">Current kiosk scene: {currentWidget.id}</span>
      {paused ? <span className="pointer-events-none absolute right-5 top-5 z-30 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/65 backdrop-blur-sm">Paused</span> : null}
      {manualSportsOverride ? <span className="pointer-events-none absolute bottom-5 right-5 z-30 rounded-full border border-amber-200/30 bg-black/45 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100/85 backdrop-blur-sm">TEST OVERRIDE</span> : null}
    </div>
    </KioskSlideshowProvider>
  );
}

type DemoStep =
  | { id: "clock" | "weather" | "calendar" | "notifications" | "music" | "system"; duration: number }
  | { id: "sports" | "resilience"; duration: number };

const SPONSOR_DEMO_STEPS: DemoStep[] = [
  { id: "clock", duration: 10_000 },
  { id: "weather", duration: 10_000 },
  { id: "calendar", duration: 10_000 },
  { id: "notifications", duration: 10_000 },
  { id: "music", duration: 10_000 },
  { id: "sports", duration: 10_000 },
  { id: "system", duration: 10_000 },
  { id: "resilience", duration: 6_000 },
  { id: "clock", duration: 10_000 },
];

function KioskSponsorDemo() {
  const searchParams = useSearchParams();
  const { setPersistentClockHidden } = useKioskAmbientFrame();
  const loop = searchParams.get("loop") === "1";
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [completed, setCompleted] = useState(false);
  const transitionTimeoutRef = useRef<number | null>(null);
  const steps = SPONSOR_DEMO_STEPS;
  const currentStep = steps[currentIndex];
  const previousStep = previousIndex === null ? null : steps[previousIndex];
  const widgets = useMemo(() => dashboardWidgets.filter((widget) => ["clock", "weather", "calendar", "notifications", "music", "system"].includes(widget.id) && WIDGET_REGISTRY.some((entry) => entry.id === widget.id && entry.enabled)), []);
  const widgetById = useMemo(() => new Map(widgets.map((widget) => [widget.id, widget])), [widgets]);

  const advance = useCallback(() => {
    if (paused || completed || transitionTimeoutRef.current !== null) return;
    const nextIndex = currentIndex + 1;
    if (nextIndex >= steps.length) {
      if (loop) {
        setPreviousIndex(currentIndex);
        setCurrentIndex(0);
        transitionTimeoutRef.current = window.setTimeout(() => {
          setPreviousIndex(null);
          transitionTimeoutRef.current = null;
        }, KIOSK_TRANSITION_DURATION_MS);
      } else {
        setCompleted(true);
      }
      return;
    }
    setPreviousIndex(currentIndex);
    setCurrentIndex(nextIndex);
    transitionTimeoutRef.current = window.setTimeout(() => {
      setPreviousIndex(null);
      transitionTimeoutRef.current = null;
    }, KIOSK_TRANSITION_DURATION_MS);
  }, [completed, currentIndex, loop, paused, steps.length]);

  useEffect(() => {
    if (paused || completed) return;
    const timer = window.setTimeout(advance, currentStep.duration);
    return () => window.clearTimeout(timer);
  }, [advance, completed, currentStep.duration, paused]);

  useEffect(() => () => {
    if (transitionTimeoutRef.current !== null) window.clearTimeout(transitionTimeoutRef.current);
  }, []);

  useEffect(() => {
    setPersistentClockHidden(currentStep.id !== "clock");
    return () => setPersistentClockHidden(false);
  }, [currentStep.id, setPersistentClockHidden]);

  const currentWidget = widgetById.get(currentStep.id);
  const previousWidget = previousStep ? widgetById.get(previousStep.id) : undefined;
  const control = {
    currentSlide: currentStep.id,
    paused,
    pauseReason: paused ? "manual" as const : null,
    pause: () => setPaused(true),
    resume: () => { setPaused(false); setCompleted(false); },
    togglePause: () => setPaused((value) => !value),
    setMusicPlaying: () => undefined,
  };

  return (
    <KioskSlideshowProvider value={control}>
      <div className="kiosk-slideshow absolute inset-0 h-[100dvh] w-[100dvw] overflow-hidden" aria-label="Cosmic sponsor presentation">
        {previousWidget ? <KioskSlide key={`demo-previous-${previousWidget.id}-${previousIndex}`} widget={previousWidget} active={false} exiting /> : null}
        {currentWidget ? <KioskSlide key={`demo-current-${currentWidget.id}-${currentIndex}`} widget={currentWidget} active exiting={false} /> : null}
        {previousStep?.id === "sports" ? <div className="kiosk-sports-transition-layer kiosk-sports-transition-sports kiosk-sports-transition-sports-exiting"><KioskSportsOverride event={createTestEvent("nfl")} /></div> : null}
        {currentStep.id === "sports" ? <div className="kiosk-sports-transition-layer kiosk-sports-transition-sports kiosk-sports-transition-sports-entering"><KioskSportsOverride event={createTestEvent("nfl")} /></div> : null}
        {previousStep?.id === "resilience" ? <div className="kiosk-demo-transition-layer kiosk-demo-transition-exit"><KioskDemoResilienceScene initiallyRecovered /></div> : null}
        {currentStep.id === "resilience" ? <div className="kiosk-demo-transition-layer kiosk-demo-transition-enter"><KioskDemoResilienceScene /></div> : null}
        {completed ? <span className="sr-only" aria-live="polite">Sponsor presentation complete</span> : null}
      </div>
    </KioskSlideshowProvider>
  );
}

function KioskDemoResilienceScene({ initiallyRecovered = false }: { initiallyRecovered?: boolean }) {
  const [recovered, setRecovered] = useState(initiallyRecovered);
  useEffect(() => {
    if (initiallyRecovered) return;
    const timer = window.setTimeout(() => setRecovered(true), 2_500);
    return () => window.clearTimeout(timer);
  }, [initiallyRecovered]);
  return <KioskSceneFrame scene="system" eyebrow="COSMIC • SYSTEM" title={recovered ? "Recovered" : "Reconnecting"} subtitle={recovered ? "Display status is current again." : "Cosmic will reconnect automatically."}><div className="kiosk-native-scene-details"><span>{recovered ? "Connection restored" : "Refreshing display state"}</span></div></KioskSceneFrame>;
}
