"use client";

import {
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
import KioskSportsOverride from "./KioskSportsOverride";

import {
  selectKioskLiveEvent,
} from "./kioskSports";

import {
  KIOSK_SLIDE_DURATION_MS,
  KIOSK_TRANSITION_DURATION_MS,
} from "./kioskConfig";

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
  const safeCurrentIndex = widgets.length > 0
    ? Math.min(currentIndex, widgets.length - 1)
    : 0;
  const safePreviousIndex = previousIndex !== null && previousIndex < widgets.length
    ? previousIndex
    : null;

  useEffect(() => {
    if (liveEvent) {
      return;
    }

    if (widgets.length <= 1) {
      return;
    }

    intervalRef.current =
      window.setInterval(() => {
        setCurrentIndex(
          (current) => {
            const from = Math.min(current, widgets.length - 1);
            const to = (from + 1) % widgets.length;
            setPreviousIndex(from);
            if (process.env.NODE_ENV !== "production") console.info(`[kiosk-slideshow] transition from=${from} to=${to}`);

            return to;
          },
        );

        if (transitionTimeoutRef.current !== null) {
          window.clearTimeout(transitionTimeoutRef.current);
        }

        transitionTimeoutRef.current =
          window.setTimeout(
            () => {
              setPreviousIndex(null);
              transitionTimeoutRef.current = null;
              if (process.env.NODE_ENV !== "production") console.info("[kiosk-slideshow] transition-complete");
            },
            KIOSK_TRANSITION_DURATION_MS,
          );
      }, KIOSK_SLIDE_DURATION_MS);

    if (process.env.NODE_ENV !== "production") console.info("[kiosk-slideshow] interval-start");

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
      if (process.env.NODE_ENV !== "production") console.info("[kiosk-slideshow] interval-stop");
    };
  }, [
    liveEvent,
    widgets.length,
  ]);

  if (liveEvent) {
    return (
      <KioskSportsOverride
        event={liveEvent}
      />
    );
  }

  if (widgets.length === 0) {
    return (
      <div className="grid min-h-[100svh] place-items-center px-6 text-center">
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

  const currentWidget = widgets[safeCurrentIndex];

  const previousWidget =
    safePreviousIndex !== null
      ? widgets[safePreviousIndex]
      : null;

  if (!currentWidget) {
    return null;
  }

  return (
    <div className="kiosk-slideshow relative h-[100svh] w-full overflow-hidden">
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

      <div className="kiosk-indicator pointer-events-none absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-30 -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 backdrop-blur-xl">
          {widgets.map((widget, index) => (
            <span
              key={widget.id}
              className={[
                "h-1.5 rounded-full transition-all duration-300",
                index === safeCurrentIndex
                  ? "w-6 bg-white/80"
                  : "w-1.5 bg-white/22",
              ].join(" ")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
