"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

import type { Alarm } from "@/core/contracts/Clock";
import { useClockTick } from "@/hooks/os/useClock";
import {
  type ClockRepository,
  useClockRepository,
} from "@/services/clock/localRepository";
import { getAlarmOccurrenceBetween } from "@/services/clock/time";
import { useCosmicScope } from "@/services/storage/scope";
import ClockAlarmOverlay from "./ClockAlarmOverlay";

const ClockContext = createContext<ClockRepository | null>(null);

function ClockRuntime() {
  const clock = useClockData();
  const now = useClockTick(1_000);
  const lastCheck = useRef<number | null>(null);
  const [activeAlarm, setActiveAlarm] = useState<Alarm | null>(null);
  const scope = useCosmicScope();
  useEffect(() => { const timer = window.setTimeout(() => { setActiveAlarm(null); lastCheck.current = null; }, 0); return () => window.clearTimeout(timer); }, [scope.id]);

  useEffect(() => {
    if (now === null || !clock.ready) return;

    const runtimeUpdate = window.setTimeout(() => {
      const start = lastCheck.current ?? now - 60_000;
      lastCheck.current = now;
      clock.completeExpiredTimers(now);

      if (activeAlarm) return;
      for (const alarm of clock.data.alarms) {
        const occurrence = getAlarmOccurrenceBetween(alarm, start, now);
        if (occurrence === null) continue;
        setActiveAlarm(alarm);
        clock.saveAlarm({
          ...alarm,
          enabled: alarm.repeatWeekdays.length > 0,
          lastTriggeredAt: occurrence,
          snoozedUntil: undefined,
          updatedAt: new Date(now).toISOString(),
        });
        break;
      }
    }, 0);

    return () => window.clearTimeout(runtimeUpdate);
  }, [activeAlarm, clock, now]);

  if (!activeAlarm || now === null) return null;

  const dismiss = () => {
    const latest = clock.data.alarms.find((alarm) => alarm.id === activeAlarm.id) ?? activeAlarm;
    clock.saveAlarm({
      ...latest,
      enabled: latest.repeatWeekdays.length > 0,
      snoozedUntil: undefined,
      updatedAt: new Date(now).toISOString(),
    });
    setActiveAlarm(null);
  };

  const snooze = () => {
    const latest = clock.data.alarms.find((alarm) => alarm.id === activeAlarm.id) ?? activeAlarm;
    clock.saveAlarm({
      ...latest,
      enabled: true,
      snoozedUntil: now + 9 * 60_000,
      updatedAt: new Date(now).toISOString(),
    });
    setActiveAlarm(null);
  };

  return (
    <ClockAlarmOverlay
      alarm={activeAlarm}
      now={now}
      onDismiss={dismiss}
      onSnooze={snooze}
    />
  );
}

export function ClockProvider({ children }: { children: React.ReactNode }) {
  const repository = useClockRepository();

  return (
    <ClockContext.Provider value={repository}>
      {children}
      <ClockRuntime />
    </ClockContext.Provider>
  );
}

export function useClockData() {
  const value = useContext(ClockContext);
  if (!value) throw new Error("useClockData must be used inside ClockProvider.");
  return value;
}
