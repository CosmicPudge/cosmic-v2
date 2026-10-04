"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SportsEvent } from "@/core/contracts/Sports";
import type { SportsLiveData } from "@/core/contracts/sports/Core";
import { createSportsScoreObservation, createTestSportsCelebration, detectSportsCelebration, sportsCelebrationDurationMs, type ScoreCelebrationKind, type SportsCelebration } from "./sportsCelebration";

export function useSportsCelebration(event: SportsEvent, live: SportsLiveData | null | undefined, visible: boolean, forcedKind?: ScoreCelebrationKind) {
  const observation = useMemo(() => createSportsScoreObservation(event, live?.sport === "mlb" || live?.sport === "nfl" || event.sport === "college-football" ? live as Parameters<typeof createSportsScoreObservation>[1] : null), [event, live]);
  const previousRef = useRef<ReturnType<typeof createSportsScoreObservation> | null>(null);
  const forcedEventRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const [celebration, setCelebration] = useState<SportsCelebration | null>(null);

  useEffect(() => {
    if (!visible || !["mlb", "nfl", "college-football"].includes(event.sport)) {
      previousRef.current = null;
      forcedEventRef.current = null;
      const clearTask = window.setTimeout(() => setCelebration(null), 0);
      return () => window.clearTimeout(clearTask);
    }
    const previous = previousRef.current;
    previousRef.current = observation;
    const canForce = Boolean(forcedKind && forcedEventRef.current !== event.id);
    if (canForce) forcedEventRef.current = event.id;
    const detected = canForce && forcedKind ? createTestSportsCelebration(event, forcedKind) : detectSportsCelebration(previous, observation, event);
    if (!detected) return;
    setCelebration(detected);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCelebration(null), sportsCelebrationDurationMs(detected.kind));
  }, [event, forcedKind, observation, visible]);

  useEffect(() => () => { if (timerRef.current !== null) window.clearTimeout(timerRef.current); }, []);
  return celebration;
}
