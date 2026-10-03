import type { SportsEvent } from "@/core/contracts/Sports";
import type { BaseballLiveData } from "@/core/contracts/sports/Baseball";
import type { FootballLiveData } from "@/core/contracts/sports/Football";
import { getMlbTeamTheme } from "@/services/sports/providers/mlb/teamThemes";

export type ScoreCelebrationKind = "score" | "home-run";

export interface SportsScoreObservation {
  eventId: string;
  sport: SportsEvent["sport"];
  homeScore?: number;
  awayScore?: number;
  homeTeamId?: string;
  awayTeamId?: string;
  stale: boolean;
  observedAt: number;
  playId?: string;
  scoringPlay?: boolean;
  playType?: string;
  playDescription?: string;
}

export interface SportsCelebration {
  kind: ScoreCelebrationKind;
  eventId: string;
  teamId?: string;
  primaryColor: string;
  secondaryColor: string;
  playId?: string;
  label: "SCORE" | "HOME RUN";
}

const NEUTRAL_SECONDARY = "#D7E7F5";
const NFL_TEAM_COLORS: Record<string, [string, string]> = {
  GB: ["#203731", "#FFB612"], CHI: ["#0B162A", "#C83803"], DET: ["#0076B6", "#B0B7BC"], TB: ["#D50A0A", "#FF7900"],
  DAL: ["#041E42", "#869397"], KC: ["#E31837", "#FFB81C"], SF: ["#AA0000", "#B3995D"], PHI: ["#004C54", "#A5ACAF"],
  DEN: ["#FB4F14", "#002244"], MIN: ["#4F2683", "#FFC62F"], LAR: ["#003594", "#FFA300"], LAC: ["#0080C6", "#FFC20E"],
  NYJ: ["#125740", "#FFFFFF"], NYG: ["#0B2265", "#A71930"], PIT: ["#FFB612", "#101820"], BAL: ["#241773", "#9E7C0C"],
};

function liveScores(event: SportsEvent, live?: BaseballLiveData | FootballLiveData | null) {
  if (live?.sport === "mlb" || live?.sport === "nfl") {
    return {
      homeScore: live.home.score,
      awayScore: live.away.score,
      homeTeamId: live.home.team.id,
      awayTeamId: live.away.team.id,
    };
  }
  return {
    homeScore: event.homeTeam?.score,
    awayScore: event.awayTeam?.score,
    homeTeamId: event.homeTeam?.id,
    awayTeamId: event.awayTeam?.id,
  };
}

export function createSportsScoreObservation(
  event: SportsEvent,
  live?: BaseballLiveData | FootballLiveData | null,
  observedAt = Date.now(),
): SportsScoreObservation {
  const scores = liveScores(event, live);
  const play = live?.sport === "mlb" ? live.latestPlay : live?.sport === "nfl" ? live.latestPlay : undefined;
  const scoringPlay = live?.sport === "mlb" ? play?.scoringPlay : live?.sport === "nfl" ? play?.scoringPlay : undefined;
  const playType = live?.sport === "mlb" ? live.latestPlay?.eventType : live?.sport === "nfl" ? live.latestPlay?.type : undefined;
  return {
    eventId: event.id,
    sport: event.sport,
    ...scores,
    stale: Boolean(live?.stale),
    observedAt,
    ...(play?.id ? { playId: play.id } : {}),
    ...(scoringPlay !== undefined ? { scoringPlay } : {}),
    ...(playType ? { playType } : {}),
    ...(play?.description ? { playDescription: play.description } : {}),
  };
}

function isHomeRun(observation: SportsScoreObservation) {
  const value = `${observation.playType ?? ""} ${observation.playDescription ?? ""}`.toLowerCase();
  return observation.sport === "mlb" && observation.scoringPlay === true && /home\s*run|homerun|home_run/.test(value);
}

function colorsForTeam(sport: SportsEvent["sport"], teamId?: string, abbreviation?: string) {
  if (sport === "mlb") {
    const theme = getMlbTeamTheme({ id: teamId, abbreviation });
    return { primaryColor: theme.primary, secondaryColor: theme.secondary || NEUTRAL_SECONDARY };
  }
  const pair = NFL_TEAM_COLORS[abbreviation?.toUpperCase() ?? teamId?.toUpperCase() ?? ""];
  return { primaryColor: pair?.[0] ?? "#8AE7FF", secondaryColor: pair?.[1] ?? NEUTRAL_SECONDARY };
}

export function detectSportsCelebration(previous: SportsScoreObservation | null, current: SportsScoreObservation, event: SportsEvent): SportsCelebration | null {
  if (!previous || previous.eventId !== current.eventId || previous.stale || current.stale) return null;
  if (!(["mlb", "nfl", "college-football"] as string[]).includes(current.sport)) return null;
  if (current.observedAt - previous.observedAt > 90_000) return null;
  const awayDelta = (current.awayScore ?? 0) - (previous.awayScore ?? 0);
  const homeDelta = (current.homeScore ?? 0) - (previous.homeScore ?? 0);
  if (awayDelta <= 0 && homeDelta <= 0) return null;
  const awayScored = awayDelta > homeDelta;
  const team = awayScored ? event.awayTeam : event.homeTeam;
  const colors = colorsForTeam(current.sport, team?.id, team?.abbreviation);
  const kind = isHomeRun(current) ? "home-run" : "score";
  return { kind, eventId: current.eventId, teamId: team?.id, ...colors, ...(current.playId ? { playId: current.playId } : {}), label: kind === "home-run" ? "HOME RUN" : "SCORE" };
}

export function createTestSportsCelebration(event: SportsEvent, kind: ScoreCelebrationKind): SportsCelebration {
  const team = event.homeTeam ?? event.awayTeam;
  const colors = colorsForTeam(event.sport, team?.id, team?.abbreviation);
  return { kind, eventId: event.id, teamId: team?.id, ...colors, label: kind === "home-run" ? "HOME RUN" : "SCORE" };
}
