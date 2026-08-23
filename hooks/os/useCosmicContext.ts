"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useSettingsRepository } from "@/services/settings/localRepository";
import { useCosmicScope } from "@/services/storage/scope";
import { eventMatchesPreferences } from "@/services/sports/preferences";
import { buildContextSnapshot } from "@/services/context/domain";
import { calendarContext, clockContext, financeContext, garageContext, mailContext, musicContext, schoolContext, sportsContext } from "@/services/context/adapters";
import { useEntitlements } from "@/hooks/os/useEntitlements";

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
  const settings = useSettingsRepository();
  const entitlements = useEntitlements();
  const scope = useCosmicScope();
  const [dismissed, setDismissed] = useState<Record<string, number>>({});
  useEffect(() => { const timer = window.setTimeout(() => setDismissed({}), 0); return () => window.clearTimeout(timer); }, [scope.id]);

  const candidates = useMemo(() => [
    ...calendarContext(calendar.calendar, now),
    ...schoolContext(school.data, now),
    ...sportsContext(sports.data ? { ...sports.data, live: sports.data.live.filter((event) => eventMatchesPreferences(event, settings.data.preferences)), upcoming: sports.data.upcoming.filter((event) => eventMatchesPreferences(event, settings.data.preferences)) } : null, now),
    ...financeContext(finance.data, now),
    ...garageContext(garage.selectedVehicle, garage.summary, now),
    ...clockContext(clock.data, now),
    ...musicContext(music.snapshot, now),
    ...mailContext(mail.messages.filter((message) => message.unread).length, now),
  ], [calendar.calendar, school.data, sports.data, finance.data, garage.selectedVehicle, garage.summary, clock.data, music.snapshot, mail.messages, settings.data.preferences, now]);

  const moduleForSource: Record<string, keyof typeof settings.data.preferences.modules> = { sports: "sports", finance: "finance", school: "school", garage: "garage", mail: "mail", calendar: "calendar" };
  const basicContextKinds = new Set(["current-event", "next-event", "current-class", "next-class", "assignment", "live-event", "upcoming-event", "maintenance", "timer", "unread"]);
  const entitledCandidates = entitlements.data.features["context.full"] ? candidates : candidates.filter((item) => basicContextKinds.has(item.kind));
  const visible = entitledCandidates.filter((item) => settings.data.preferences.context.enabledSources.length === 0 || settings.data.preferences.context.enabledSources.includes(item.source)).filter((item) => !settings.data.preferences.context.suppressedKinds.includes(item.kind)).filter((item) => moduleForSource[item.source] ? settings.data.preferences.modules[moduleForSource[item.source]] : true).filter((item) => !dismissed[item.id]);
  const snapshot = useMemo(() => buildContextSnapshot(visible, now), [visible, now]);
  const dismiss = (item: CosmicContextItem) => setDismissed((current) => ({ ...current, [item.id]: nowValue ?? 0 }));
  return { ...snapshot, candidates: entitledCandidates, dismiss, loading: calendar.loading || sports.loading || !finance.ready || !school.ready || !clock.ready || !settings.ready || entitlements.loading };
}

export default useCosmicContext;
