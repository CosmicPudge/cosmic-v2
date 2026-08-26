"use client";

import { useSearchParams } from "next/navigation";
import type { SportsEvent } from "@/core/contracts/Sports";
import type { BaseballLiveData, BaseballUniform } from "@/core/contracts/sports/Baseball";
import { useSportsEvent } from "@/hooks/os/useSportsEvent";
import { MLB_UNIFORM_THEMES } from "@/services/sports/providers/mlb/uniformThemes";

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

  return <KioskBaseballView event={event} live={baseballLive ?? (isDevelopmentTest ? createTestBaseballLive(event, searchParams.get("home-uniform"), searchParams.get("away-uniform")) : undefined)} />;
}

function fixtureUniform(teamId: string, code: string | null): BaseballUniform | undefined {
  if (!code || !MLB_UNIFORM_THEMES[teamId]?.[code]) return undefined;
  return { teamId, assets: [{ code, typeCode: "J", active: true }] };
}

function createTestBaseballLive(event: SportsEvent, homeUniformCode: string | null, awayUniformCode: string | null): BaseballLiveData {
  const away = event.awayTeam;
  const home = event.homeTeam;
  const awayUniform = fixtureUniform("114", awayUniformCode ?? "114_jersey_4_2026");
  const homeUniform = fixtureUniform("108", homeUniformCode ?? "108_jersey_1_2026");
  return {
    eventId: event.id, sport: "mlb", generatedAt: new Date().toISOString(), stale: false, sources: [],
    away: { team: { id: "114", name: away?.name ?? "Cleveland Guardians", abbreviation: away?.abbreviation ?? "CLE" }, score: 8, hits: 12, errors: 1, uniform: awayUniform },
    home: { team: { id: "108", name: home?.name ?? "Los Angeles Angels", abbreviation: home?.abbreviation ?? "LAA" }, score: 6, hits: 9, errors: 0, uniform: homeUniform },
    inning: 10, inningHalf: "top", count: { balls: 2, strikes: 1, outs: 1 },
    bases: { first: { base: 1, confirmed: true }, second: { base: 2, confirmed: true } },
    matchup: { batter: { name: "José Ramírez", shortName: "J. Ramírez", position: "3B", teamId: "114" }, pitcher: { id: "kiosk-test-pitcher", name: "Ryan Watson", shortName: "R. Watson", position: "RHP", teamId: "108" } },
    latestPlay: { description: "José Ramírez doubled to left field. Giménez scored.", shortDescription: "Double", inning: 10, inningHalf: "top" },
    latestPitch: { velocityMph: 94.8, typeName: "Four-seam fastball", pitchNumber: 27 },
    linescore: { innings: [0, 2, 1, 0, 0, 1, 2, 0, 1, 1].map((runs, index) => ({ inning: index + 1, away: { runs }, home: { runs: [1, 0, 2, 0, 1, 0, 1, 0, 1, 0][index] } })), away: { runs: 8, hits: 12, errors: 1 }, home: { runs: 6, hits: 9, errors: 0 } },
    boxScore: { away: { players: [] }, home: { players: [{ player: { id: "kiosk-test-pitcher", name: "Ryan Watson" }, pitching: { pitchesThrown: 27, era: "3.54" } }] } },
  };
}
