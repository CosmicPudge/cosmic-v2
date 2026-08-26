"use client";

import { useSearchParams } from "next/navigation";
import type { SportsEvent } from "@/core/contracts/Sports";
import type { BaseballLiveData } from "@/core/contracts/sports/Baseball";
import { useSportsEvent } from "@/hooks/os/useSportsEvent";

import KioskFootballView from "./sports/KioskFootballView";
import KioskBaseballView from "./sports/KioskBaseballView";
import KioskF1View from "./sports/KioskF1View";
import KioskNascarView from "./sports/KioskNascarView";

export default function KioskSportsOverride({
  event,
}: {
  event: SportsEvent;
}) {
  switch (event.sport) {
    case "nfl":
      return (
        <KioskFootballView
          event={event}
        />
      );

    case "mlb":
      return <KioskBaseballLiveView event={event} />;

    case "f1":
      return (
        <KioskF1View
          event={event}
        />
      );

    case "nascar":
      return (
        <KioskNascarView
          event={event}
        />
      );

    default:
      return null;
  }
}

function KioskBaseballLiveView({ event }: { event: SportsEvent }) {
  const searchParams = useSearchParams();
  const isDevelopmentTest = process.env.NODE_ENV !== "production" && event.source === "kiosk-test";
  const detail = useSportsEvent(event.id, { enabled: !isDevelopmentTest });
  const live = detail.data?.live;
  const baseballLive = live?.sport === "mlb" ? live : undefined;

  return <KioskBaseballView event={event} live={baseballLive ?? (isDevelopmentTest ? createTestBaseballLive(event, searchParams.get("kiosk-baseball-side")) : undefined)} />;
}

function createTestBaseballLive(event: SportsEvent, side: string | null): BaseballLiveData {
  const eventAway = event.awayTeam;
  const eventHome = event.homeTeam;
  const angels = [eventAway, eventHome].find((team) => team?.abbreviation?.toUpperCase() === "LAA" || team?.name.toLowerCase().includes("angels"));
  const opponent = angels === eventAway ? eventHome : eventAway;
  const away = side === "home" ? opponent : angels;
  const home = side === "home" ? angels : opponent;
  return {
    eventId: event.id, sport: "mlb", generatedAt: new Date().toISOString(), stale: false, sources: [],
    away: { team: { id: away?.abbreviation?.toUpperCase() === "LAA" ? "108" : "136", name: away?.name ?? "Seattle Mariners", abbreviation: away?.abbreviation ?? "SEA" }, score: away?.score ?? (away === angels ? 5 : 3), hits: 7 },
    home: { team: { id: home?.abbreviation?.toUpperCase() === "LAA" ? "108" : "136", name: home?.name ?? "Los Angeles Angels", abbreviation: home?.abbreviation ?? "LAA" }, score: home?.score ?? (home === angels ? 5 : 3), hits: 8 },
    inning: 7, inningHalf: "top", count: { balls: 2, strikes: 1, outs: 1 },
    bases: { first: { base: 1, confirmed: true }, third: { base: 3, confirmed: true } },
    matchup: { batter: { name: "Mike Trout", shortName: "M. Trout" }, pitcher: { name: "Luis Castillo", shortName: "L. Castillo" } },
    latestPlay: { description: "Trout singles to center. Neto to third.", shortDescription: "Single", inning: 7, inningHalf: "top" },
  };
}
