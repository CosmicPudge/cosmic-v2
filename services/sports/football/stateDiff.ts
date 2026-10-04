import type { FootballLiveData } from "@/core/contracts/sports/Football";
import type { CollegeFootballLiveData } from "@/services/sports/providers/college-football-detail";

export type FootballLiveSource = FootballLiveData | CollegeFootballLiveData | null | undefined;

export interface FootballStateDelta {
  scoreChanged: boolean;
  clockChanged: boolean;
  periodChanged: boolean;
  possessionChanged: boolean;
  situationChanged: boolean;
  playChanged: boolean;
  driveChanged: boolean;
  penaltyChanged: boolean;
  reviewChanged: boolean;
  statsChanged: boolean;
  lifecycleChanged: boolean;
}

const value = (source: FootballLiveSource) => source && typeof source === "object" ? source : undefined;
const playId = (source: FootballLiveSource) => { const record = value(source); const play = record && "latestPlay" in record ? record.latestPlay : record && "normalizedPlays" in record ? record.normalizedPlays?.at(-1) : undefined; return play?.id ?? (play ? `${play.period ?? ""}|${play.clock ?? ""}|${play.description}` : undefined); };
const driveId = (source: FootballLiveSource) => { const drive = value(source)?.currentDrive; return drive?.id ?? (drive ? `${drive.teamId ?? ""}|${drive.plays ?? ""}|${drive.yards ?? ""}|${drive.result ?? drive.description ?? ""}` : undefined); };
const situationKey = (source: FootballLiveSource) => { const situation = value(source)?.situation; return situation ? [situation.possessionTeamId, situation.down, situation.distance, situation.downDistanceText, situation.fieldPosition?.territory, situation.fieldPosition?.yardLine, situation.redZone].join("|") : ""; };
const statsKey = (source: FootballLiveSource) => { const stats = value(source)?.stats; const teams = value(source)?.teamStats ?? stats?.teamStats; return [teams?.map((team) => [team.teamId, team.stats.totalYards, team.stats.turnovers, team.stats.firstDowns, team.stats.redZoneMade, team.stats.redZoneAttempts].join(",")).join(";"), stats?.playerLeaders?.map((leader) => `${leader.category}|${leader.playerId ?? leader.name}|${leader.statLine}`).join(";"), stats?.scoringByPeriod?.map((period) => `${period.period}:${period.away ?? ""}-${period.home ?? ""}`).join(";")].join("/"); };

export function diffFootballState(previous: FootballLiveSource, next: FootballLiveSource): FootballStateDelta {
  const before = value(previous);
  const after = value(next);
  return {
    scoreChanged: before?.away.score !== after?.away.score || before?.home.score !== after?.home.score,
    clockChanged: before?.clock !== after?.clock || before?.situation?.clock !== after?.situation?.clock,
    periodChanged: before?.period !== after?.period || before?.situation?.quarter !== after?.situation?.quarter,
    possessionChanged: before?.situation?.possessionTeamId !== after?.situation?.possessionTeamId,
    situationChanged: situationKey(previous) !== situationKey(next),
    playChanged: playId(previous) !== playId(next),
    driveChanged: driveId(previous) !== driveId(next),
    penaltyChanged: JSON.stringify([before?.penalty?.text, before?.penalty?.teamId, before?.penalty?.yards, before?.penalty?.accepted, before?.penalty?.declined, before?.penalty?.offsetting, before?.penalty?.active]) !== JSON.stringify([after?.penalty?.text, after?.penalty?.teamId, after?.penalty?.yards, after?.penalty?.accepted, after?.penalty?.declined, after?.penalty?.offsetting, after?.penalty?.active]),
    reviewChanged: JSON.stringify([before?.review?.text, before?.review?.active, before?.review?.outcome]) !== JSON.stringify([after?.review?.text, after?.review?.active, after?.review?.outcome]),
    statsChanged: statsKey(previous) !== statsKey(next),
    lifecycleChanged: JSON.stringify([before?.state, before && "status" in before ? before.status : undefined, before?.statusText, before?.stale]) !== JSON.stringify([after?.state, after && "status" in after ? after.status : undefined, after?.statusText, after?.stale]),
  };
}

export function hasFootballStateChange(delta: FootballStateDelta) {
  return Object.values(delta).some(Boolean);
}
