"use client";

import { useMemo, useState } from "react";
import type { CosmicContextItem } from "@/core/contracts/Context";
import { useClockTick } from "@/hooks/os/useClock";
import useCalendar from "@/hooks/os/useCalendar";
import { useSports } from "@/hooks/os/useSports";
import { useGarage } from "@/hooks/os/useGarage";
import { useMusic } from "@/hooks/os/useMusic";
import useMail from "@/hooks/os/useMail";
import { useClockRepository } from "@/services/clock/localRepository";
import { useFinanceRepository } from "@/services/finance/localRepository";
import { useLocalSchoolRepository } from "@/components/school/data/localRepository";
import { buildContextSnapshot } from "@/services/context/domain";
import { calendarContext, clockContext, financeContext, garageContext, mailContext, musicContext, schoolContext, sportsContext } from "@/services/context/adapters";

export function useCosmicContext() {
  const nowValue = useClockTick(30_000);
  const now = useMemo(() => new Date(nowValue ?? 0), [nowValue]);
  const calendar = useCalendar({ refreshMs: 5 * 60_000 });
  const sports = useSports({ refreshMs: 60_000 });
  const garage = useGarage();
  const music = useMusic();
  const mail = useMail();
  const clock = useClockRepository();
  const finance = useFinanceRepository();
  const school = useLocalSchoolRepository();
  const [dismissed, setDismissed] = useState<Record<string, number>>({});

  const candidates = useMemo(() => [
    ...calendarContext(calendar.calendar, now),
    ...schoolContext(school.data, now),
    ...sportsContext(sports.data, now),
    ...financeContext(finance.data, now),
    ...garageContext(garage.selectedVehicle, garage.summary, now),
    ...clockContext(clock.data, now),
    ...musicContext(music.snapshot, now),
    ...mailContext(mail.messages.filter((message) => message.unread).length, now),
  ], [calendar.calendar, school.data, sports.data, finance.data, garage.selectedVehicle, garage.summary, clock.data, music.snapshot, mail.messages, nowValue, now]);

  const visible = candidates.filter((item) => !dismissed[item.id]);
  const snapshot = useMemo(() => buildContextSnapshot(visible, now), [visible, now]);
  const dismiss = (item: CosmicContextItem) => setDismissed((current) => ({ ...current, [item.id]: nowValue ?? 0 }));
  return { ...snapshot, candidates, dismiss, loading: calendar.loading || sports.loading || !finance.ready || !school.ready || !clock.ready };
}

export default useCosmicContext;
