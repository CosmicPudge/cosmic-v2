import type { SportsEvent } from "@/core/contracts/Sports";
import type { BaseballLiveData } from "@/core/contracts/sports/Baseball";
import type { FootballLiveData } from "@/core/contracts/sports/Football";
import type { CollegeFootballLiveData } from "@/services/sports/providers/college-football-detail";
import { getMlbTeamTheme } from "@/services/sports/providers/mlb/teamThemes";
import { CFB_TEAM_IDENTITY } from "@/services/sports/identity/generated/cfbTeams";

export type ScoreCelebrationKind = "score" | "home-run" | "touchdown" | "extra-point" | "field-goal" | "two-point" | "safety";

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
  scoringIdentity?: string;
  penaltyAccepted?: boolean;
  penaltyDeclined?: boolean;
  penaltyOffsetting?: boolean;
}

export interface SportsCelebration {
  kind: ScoreCelebrationKind;
  eventId: string;
  teamId?: string;
  primaryColor: string;
  secondaryColor: string;
  playId?: string;
  label: "SCORE" | "HOME RUN" | "TOUCHDOWN" | "XP / EXTRA POINT GOOD" | "FIELD GOAL GOOD" | "2-POINT CONVERSION GOOD" | "SAFETY";
}

export function sportsCelebrationDurationMs(kind: ScoreCelebrationKind) {
  if (kind === "touchdown" || kind === "safety") return 8_000;
  if (kind === "field-goal" || kind === "two-point") return 7_000;
  if (kind === "extra-point") return 5_000;
  return kind === "home-run" ? 3_200 : 2_000;
}

const NEUTRAL_SECONDARY = "#D7E7F5";
const NFL_TEAM_COLORS: Record<string, [string, string]> = {
  GB: ["#203731", "#FFB612"], CHI: ["#0B162A", "#C83803"], DET: ["#0076B6", "#B0B7BC"], TB: ["#D50A0A", "#FF7900"],
  DAL: ["#041E42", "#869397"], KC: ["#E31837", "#FFB81C"], SF: ["#AA0000", "#B3995D"], PHI: ["#004C54", "#A5ACAF"],
  DEN: ["#FB4F14", "#002244"], MIN: ["#4F2683", "#FFC62F"], LAR: ["#003594", "#FFA300"], LAC: ["#0080C6", "#FFC20E"],
  NYJ: ["#125740", "#FFFFFF"], NYG: ["#0B2265", "#A71930"], PIT: ["#FFB612", "#101820"], BAL: ["#241773", "#9E7C0C"],
};

type SupportedLive = BaseballLiveData | FootballLiveData | CollegeFootballLiveData;

function liveScores(event: SportsEvent, live?: SupportedLive | null) {
  const liveSport = live && "sport" in live ? live.sport : undefined;
  if (live && (liveSport === "mlb" || liveSport === "nfl" || event.sport === "college-football")) {
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
  live?: SupportedLive | null,
  observedAt = Date.now(),
): SportsScoreObservation {
  const scores = liveScores(event, live);
  const play = live && "latestPlay" in live ? live.latestPlay : undefined;
  const scoringPlay = play?.scoringPlay;
  const liveSport = live && "sport" in live ? live.sport : undefined;
  const playType = liveSport === "mlb" ? (live as BaseballLiveData).latestPlay?.eventType : liveSport === "nfl" ? (live as FootballLiveData).latestPlay?.type : undefined;
  const footballPlay = play && (liveSport === "nfl" || event.sport === "college-football") ? play as FootballLiveData["latestPlay"] : undefined;
  return {
    eventId: event.id,
    sport: event.sport,
    ...scores,
    stale: Boolean(live && "stale" in live ? live.stale : false),
    observedAt,
    ...(play?.id ? { playId: play.id } : {}),
    ...(scoringPlay !== undefined ? { scoringPlay } : {}),
    ...(playType ? { playType } : {}),
    ...(play?.description ? { playDescription: play.description } : {}),
    ...(play?.scoringPlay ? { scoringIdentity: play.id ?? `${footballPlay?.period ?? ""}-${footballPlay?.clock ?? ""}-${footballPlay?.teamId ?? ""}-${play.description}` } : {}),
    ...((live && "penalty" in live && live.penalty?.accepted) || footballPlay?.penaltyAccepted ? { penaltyAccepted: true } : {}),
    ...((live && "penalty" in live && live.penalty?.declined) || footballPlay?.penaltyDeclined ? { penaltyDeclined: true } : {}),
    ...((live && "penalty" in live && live.penalty?.offsetting) || footballPlay?.penaltyOffsetting ? { penaltyOffsetting: true } : {}),
  };
}

function isHomeRun(observation: SportsScoreObservation) {
  const value = `${observation.playType ?? ""} ${observation.playDescription ?? ""}`.toLowerCase();
  return observation.sport === "mlb" && observation.scoringPlay === true && /home\s*run|homerun|home_run/.test(value);
}

function footballScoringKind(observation: SportsScoreObservation): Extract<ScoreCelebrationKind, "score" | "touchdown" | "extra-point" | "field-goal" | "two-point" | "safety"> {
  const value = `${observation.playType ?? ""} ${observation.playDescription ?? ""}`.toLowerCase();
  if (!value.trim()) return "score";
  if (/safety/.test(value)) return "safety";
  if (observation.playType === "extra-point" || /extra point|pat\b|xp good/.test(value)) return "extra-point";
  if (observation.playType === "two-point" || /two[- ]point|2[- ]point|conversion good/.test(value)) return "two-point";
  if (observation.playType === "field-goal" || /field goal/.test(value)) return "field-goal";
  return "touchdown";
}

function isNullifiedFootballScore(observation: SportsScoreObservation) {
  const value = `${observation.playDescription ?? ""}`.toLowerCase();
  return /no good|nullif|revers|overturned|penalty\s+(?:nullifies|wipes out)|score does not count|no play/.test(value) || (observation.penaltyAccepted === true && /offensive\s+(?:holding|pass interference)/.test(value));
}

function celebrationLabel(kind: ScoreCelebrationKind): SportsCelebration["label"] {
  switch (kind) {
    case "home-run": return "HOME RUN";
    case "touchdown": return "TOUCHDOWN";
    case "extra-point": return "XP / EXTRA POINT GOOD";
    case "field-goal": return "FIELD GOAL GOOD";
    case "two-point": return "2-POINT CONVERSION GOOD";
    case "safety": return "SAFETY";
    default: return "SCORE";
  }
}

function colorsForTeam(sport: SportsEvent["sport"], teamId?: string, abbreviation?: string) {
  if (sport === "mlb") {
    const theme = getMlbTeamTheme({ id: teamId, abbreviation });
    return { primaryColor: theme.primary, secondaryColor: theme.secondary || NEUTRAL_SECONDARY };
  }
  if (sport === "college-football") {
    const catalog = CFB_TEAM_IDENTITY[teamId ?? ""];
    const primary = catalog?.color ? `#${catalog.color.replace(/^#/, "")}` : undefined;
    const secondary = catalog?.alternateColor ? `#${catalog.alternateColor.replace(/^#/, "")}` : undefined;
    return { primaryColor: primary ?? "#8AE7FF", secondaryColor: secondary ?? NEUTRAL_SECONDARY };
  }
  const pair = NFL_TEAM_COLORS[abbreviation?.toUpperCase() ?? teamId?.toUpperCase() ?? ""];
  return { primaryColor: pair?.[0] ?? "#8AE7FF", secondaryColor: pair?.[1] ?? NEUTRAL_SECONDARY };
}

export function detectSportsCelebration(previous: SportsScoreObservation | null, current: SportsScoreObservation, event: SportsEvent): SportsCelebration | null {
  if (!previous || previous.eventId !== current.eventId || previous.stale || current.stale) return null;
  if (previous.scoringIdentity && current.scoringIdentity && previous.scoringIdentity === current.scoringIdentity) return null;
  if (!(["mlb", "nfl", "college-football"] as string[]).includes(current.sport)) return null;
  if (current.observedAt - previous.observedAt > 90_000) return null;
  const awayDelta = (current.awayScore ?? 0) - (previous.awayScore ?? 0);
  const homeDelta = (current.homeScore ?? 0) - (previous.homeScore ?? 0);
  if (awayDelta <= 0 && homeDelta <= 0) return null;
  const awayScored = awayDelta > homeDelta;
  const team = awayScored ? event.awayTeam : event.homeTeam;
  const colors = colorsForTeam(current.sport, team?.id, team?.abbreviation);
  if (current.sport !== "mlb" && isNullifiedFootballScore(current)) return null;
  const kind: ScoreCelebrationKind = isHomeRun(current) ? "home-run" : current.sport === "nfl" || current.sport === "college-football" ? footballScoringKind(current) : "score";
  return { kind, eventId: current.eventId, teamId: team?.id, ...colors, ...(current.playId ? { playId: current.playId } : {}), label: celebrationLabel(kind) };
}

export function createTestSportsCelebration(event: SportsEvent, kind: ScoreCelebrationKind): SportsCelebration {
  const team = event.homeTeam ?? event.awayTeam;
  const colors = colorsForTeam(event.sport, team?.id, team?.abbreviation);
  return { kind, eventId: event.id, teamId: team?.id, ...colors, label: celebrationLabel(kind) };
}
