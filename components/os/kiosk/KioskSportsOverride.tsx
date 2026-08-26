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
    away: { team: { id: away?.abbreviation?.toUpperCase() === "LAA" ? "108" : "136", name: away?.name ?? "Seattle Mariners", abbreviation: away?.abbreviation ?? "SEA" }, score: away?.score ?? (away === angels ? 5 : 3), hits: 7, errors: 0 },
    home: { team: { id: home?.abbreviation?.toUpperCase() === "LAA" ? "108" : "136", name: home?.name ?? "Los Angeles Angels", abbreviation: home?.abbreviation ?? "LAA" }, score: home?.score ?? (home === angels ? 5 : 3), hits: 8, errors: 1 },
    inning: 7, inningHalf: "top", count: { balls: 2, strikes: 1, outs: 1 },
    bases: { first: { base: 1, confirmed: true }, third: { base: 3, confirmed: true } },
    matchup: { batter: { name: "Mike Trout", shortName: "M. Trout" }, pitcher: { id: "kiosk-test-pitcher", name: "Luis Castillo", shortName: "L. Castillo" } },
    latestPlay: { description: "Trout singles to center. Neto to third.", shortDescription: "Single", inning: 7, inningHalf: "top" },
    latestPitch: { velocityMph: 95.6, typeName: "Four-seam fastball", pitchNumber: 27 },
    linescore: { innings: Array.from({ length: 9 }, (_, index) => ({ inning: index + 1, away: { runs: index === 1 ? 1 : index === 4 ? 2 : 0 }, home: { runs: index === 1 ? 0 : index === 4 ? 2 : 0 } })), away: { runs: 3, hits: 7, errors: 0 }, home: { runs: 5, hits: 8, errors: 1 } },
    boxScore: { away: { players: [] }, home: { players: [{ player: { id: "kiosk-test-pitcher", name: "Luis Castillo" }, pitching: { pitchesThrown: 27, era: "3.54" } }] } },
  };
}
