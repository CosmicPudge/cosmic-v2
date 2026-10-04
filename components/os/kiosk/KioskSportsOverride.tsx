"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import type { SportsEvent } from "@/core/contracts/Sports";
import type { BaseballLiveData, BaseballUniform } from "@/core/contracts/sports/Baseball";
import type { CollegeFootballLiveData } from "@/services/sports/providers/college-football-detail";
import type { FootballLiveData } from "@/core/contracts/sports/Football";
import { useSportsEvent } from "@/hooks/os/useSportsEvent";
import { MLB_UNIFORM_THEMES } from "@/services/sports/providers/mlb/uniformThemes";
import { sportsDetailIsComplete, sportsDetailPresence } from "@/services/sports/detailDiagnostics";
import KioskSportsScene from "./sports/KioskSportsScene";
import SportsCelebrationOverlay from "./sports/SportsCelebrationOverlay";
import { useSportsCelebration } from "./sports/useSportsCelebration";
import type { ScoreCelebrationKind } from "./sports/sportsCelebration";

import KioskFootballView from "./sports/KioskFootballView";
import KioskBaseballView from "./sports/KioskBaseballView";
import KioskF1View from "./sports/KioskF1View";
import KioskNascarView from "./sports/KioskNascarView";

export default function KioskSportsOverride({
  event,
  visible = true,
}: {
  event: SportsEvent;
  visible?: boolean;
}) {
  return <KioskSportsPresentation event={event} visible={visible} />;
}

function KioskSportsPresentation({ event, visible }: { event: SportsEvent; visible: boolean }) {
  const searchParams = useSearchParams();
  const isDevelopmentTest = process.env.NODE_ENV !== "production" && event.source === "kiosk-test";
  const detail = useSportsEvent(event.id, { sport: event.sport, enabled: !isDevelopmentTest && (event.sport === "mlb" || event.sport === "nfl" || event.sport === "college-football") });
  const fetchedLive = detail.data?.live;
  const testFootball = isDevelopmentTest && (event.sport === "nfl" || event.sport === "college-football") && ["live", "halftime", "overtime", "delayed", "suspended", "final"].includes(searchParams.get("state") ?? "live") ? createTestFootballLive(event, searchParams.get("football"), searchParams.get("state")) : undefined;
  const live = testFootball ?? fetchedLive;
  const baseballLive = fetchedLive?.sport === "mlb" ? fetchedLive : undefined;
  const footballLive = fetchedLive?.sport === "nfl" ? fetchedLive : testFootball && event.sport === "nfl" ? testFootball as FootballLiveData : undefined;
  const collegeFootballLive = event.sport === "college-football" && live ? live as unknown as CollegeFootballLiveData : undefined;
  useEffect(() => {
    if (typeof window === "undefined" || event.sport !== "mlb" || !["dev.cosmicpudge.shop", "localhost", "127.0.0.1"].includes(window.location.hostname.toLowerCase())) return;
    const presence = sportsDetailPresence(baseballLive);
    const fields = Object.fromEntries(Object.entries(presence).filter(([key]) => key !== "detail"));
    console.info(`[kiosk-mlb-render] event=${event.id} genericSnapshot=${Boolean(event)} liveDetail=${Boolean(baseballLive)} normalizedComplete=${sportsDetailIsComplete(presence)} fallbackShell=${!baseballLive} reason=${baseballLive ? "detail_available" : detail.error ? "detail_request_failed" : "no_live_detail"} ${Object.entries(fields).map(([key, value]) => `${key}=${value}`).join(" ")}`);
  }, [baseballLive, detail.error, event]);
  const forcedKind = isDevelopmentTest && ((searchParams.get("celebration") === "score" && (event.sport === "mlb" || event.sport === "nfl" || event.sport === "college-football")) || (searchParams.get("celebration") === "homerun" && event.sport === "mlb"))
    ? searchParams.get("celebration") as ScoreCelebrationKind
    : undefined;
  const celebration = useSportsCelebration(event, fetchedLive, visible, forcedKind);
  const content = (() => {
    switch (event.sport) {
      case "nfl":
        return <KioskFootballView event={event} live={footballLive} />;
      case "college-football":
        return <KioskFootballView event={event} live={collegeFootballLive} />;
      case "mlb":
        return <KioskBaseballView event={event} live={baseballLive ?? (isDevelopmentTest ? createTestBaseballLive(event, searchParams.get("home-uniform"), searchParams.get("away-uniform")) : undefined)} />;
      case "f1":
        return <KioskF1View event={event} />;
      case "nascar":
        return <KioskNascarView event={event} />;
      default:
        return null;
    }
  })();
  return <KioskSportsScene event={event} celebration={<SportsCelebrationOverlay celebration={celebration} />}>{content}</KioskSportsScene>;
}

function createTestFootballLive(event: SportsEvent, state: string | null, lifecycle: string | null): FootballLiveData | CollegeFootballLiveData {
  const away = event.awayTeam ?? { id: "68", name: "Boise State Broncos", abbreviation: "BSU" };
  const home = event.homeTeam ?? { id: "328", name: "Utah State Aggies", abbreviation: "USU" };
  const situation = { quarter: 3, clock: "08:42", possessionTeamId: home.id, downDistanceText: state === "redzone" ? "1st & Goal" : "2nd & 7 at USU 35", possessionText: state === "redzone" ? "USU 8" : "USU 35", redZone: state === "redzone" };
  const stats = state === "stats" || lifecycle === "halftime" ? {
    teamStats: [
      { teamId: away.id, teamAbbreviation: away.abbreviation, stats: { totalYards: 184, passingYards: 112, rushingYards: 72, firstDowns: 10, turnovers: 1, thirdDownMade: 3, thirdDownAttempts: 7, fourthDownMade: 0, fourthDownAttempts: 1, penalties: 5, penaltyYards: 42, possessionTime: "26:14", redZoneMade: 1, redZoneAttempts: 2 } },
      { teamId: home.id, teamAbbreviation: home.abbreviation, stats: { totalYards: 276, passingYards: 189, rushingYards: 87, firstDowns: 15, turnovers: 0, thirdDownMade: 5, thirdDownAttempts: 8, fourthDownMade: 1, fourthDownAttempts: 1, penalties: 3, penaltyYards: 25, possessionTime: "33:46", redZoneMade: 2, redZoneAttempts: 2 } },
    ],
    playerLeaders: [
      { category: "passing" as const, name: "Jordan Keller", teamId: away.id, statLine: "14/21 · 186 YDS · 2 TD" },
      { category: "rushing" as const, name: "Marcus Reed", teamId: home.id, statLine: "12 CAR · 74 YDS" },
      { category: "receiving" as const, name: "Evan Brooks", teamId: away.id, statLine: "5 REC · 83 YDS · TD" },
    ],
    recentDrives: [
      { teamId: away.id, teamAbbreviation: away.abbreviation, result: "Punt", plays: 3, yards: 8, elapsedTime: "1:22" },
      { teamId: home.id, teamAbbreviation: home.abbreviation, result: "Touchdown", plays: 7, yards: 68, elapsedTime: "3:14" },
      { teamId: away.id, teamAbbreviation: away.abbreviation, result: "Field Goal", plays: 9, yards: 51, elapsedTime: "4:03" },
    ],
    scoringByPeriod: [{ period: 1, away: 0, home: 7 }, { period: 2, away: 7, home: 7 }],
    scoringPlays: [{ period: 2, clock: "12:48", teamId: home.id, teamAbbreviation: home.abbreviation, description: "18-yard touchdown pass", points: 7 }],
  } : undefined;
  return { sport: event.sport === "college-football" ? "college-football" : "nfl", eventId: event.id, generatedAt: new Date().toISOString(), stale: false, sources: [], status: lifecycle === "halftime" ? "Halftime" : lifecycle === "overtime" ? "Overtime" : lifecycle === "final" ? "Final" : "Live", ...(lifecycle === "halftime" ? { state: "halftime" as const } : lifecycle === "overtime" ? { state: "overtime" as const } : lifecycle === "final" ? { state: "final" as const } : lifecycle === "delayed" ? { state: "delayed" as const } : lifecycle === "suspended" ? { state: "suspended" as const } : { state: "live" as const }), away: { team: away, score: away.score ?? 17, timeoutsRemaining: 2 }, home: { team: home, score: home.score ?? 24, timeoutsRemaining: 3, possession: true }, situation, latestPlay: { description: state === "challenge" ? "Challenge under review" : state === "flag" ? "Holding, offense" : "Pass complete for 8 yards", shortDescription: state === "challenge" ? "Review" : state === "flag" ? "Penalty" : "Complete", penalty: state === "flag", type: state === "flag" ? "penalty" : "pass" }, ...(stats ? { stats } : {}), ...(state === "flag" ? { penalty: { text: "Holding, offense", yards: 10 } } : {}), ...(state === "challenge" ? { review: { text: "Challenge under review", active: true } } : {}) } as FootballLiveData | CollegeFootballLiveData;
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
