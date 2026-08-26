import type { SportsEvent, SportsEventStatus, SportsStanding, SportsTeam } from "@/core/contracts/Sports";
import type { SportsProvider, SportsProviderResult } from "./types";
import { fetchJson, isRecord, number, records, string } from "./types";

const ANGELS_ID = 108;
const DAY = 86_400_000;

function dayKey(value: Date): string {
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`;
}

function statusOf(value: string | undefined): SportsEventStatus {
  const detail = value?.toLowerCase() ?? "";
  if (detail.includes("postpon")) return "postponed";
  if (detail.includes("cancel")) return "cancelled";
  if (detail.includes("delay")) return "delayed";
  if (detail.includes("final") || detail.includes("completed")) return "final";
  if (detail.includes("progress") || detail.includes("review") || detail.includes("challenge")) return "live";
  if (detail.includes("preview") || detail.includes("pregame")) return "pregame";
  return "scheduled";
}

function team(value: unknown): SportsTeam | undefined {
  if (!isRecord(value)) return undefined;
  const name = string(value.name);
  if (!name) return undefined;
  const id = number(value.id);
  return { name, ...(id !== undefined ? { id: String(id) } : {}) };
}

function gameEvent(value: unknown): SportsEvent | null {
  if (!isRecord(value)) return null;
  const gamePk = number(value.gamePk);
  const start = string(value.gameDate);
  const teams = isRecord(value.teams) ? value.teams : undefined;
  const away = teams && isRecord(teams.away) ? teams.away : undefined;
  const home = teams && isRecord(teams.home) ? teams.home : undefined;
  const awayTeam = team(away?.team);
  const homeTeam = team(home?.team);
  if (gamePk === undefined || !start || !awayTeam || !homeTeam) return null;
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return null;
  const status = isRecord(value.status) ? value.status : undefined;
  const detail = string(status?.detailedState) ?? string(status?.abstractGameState);
  const awayScore = number(away?.score);
  const homeScore = number(home?.score);
  return {
    id: `mlb:${gamePk}`,
    sport: "mlb",
    title: `${awayTeam.name} at ${homeTeam.name}`,
    start: startDate,
    status: statusOf(detail),
    ...(detail ? { statusDetail: detail } : {}),
    awayTeam: { ...awayTeam, ...(awayScore !== undefined ? { score: awayScore } : {}) },
    homeTeam: { ...homeTeam, ...(homeScore !== undefined ? { score: homeScore } : {}) },
    source: "mlb-stats-api",
    metadata: { competition: "MLB", gamePk: String(gamePk) },
  };
}

function teamStanding(payload: unknown): SportsStanding[] {
  const root = isRecord(payload) ? payload : undefined;
  return records(root?.records).flatMap((division) => records(division.teamRecords).flatMap((entry) => {
    const team = isRecord(entry.team) ? entry.team : {};
    const name = string(team.name);
    if (!name) return [];
    const wins = number(entry.wins); const losses = number(entry.losses); const rank = number(entry.divisionRank) ?? number(entry.leagueRank);
    return [{ id: `mlb-${string(team.id) ?? name}-standing`, sport: "mlb" as const, name, team: name, ...(rank !== undefined ? { rank } : {}), ...(wins !== undefined ? { wins } : {}), ...(losses !== undefined ? { losses } : {}), ...(wins !== undefined && losses !== undefined ? { record: `${wins}-${losses}` } : {}), source: "mlb-stats-api" }];
  }));
}

export class MlbAngelsProvider implements SportsProvider {
  readonly id: string;
  readonly sport = "mlb" as const;
  readonly providerName = "MLB Stats API";
  readonly official = true;
  readonly fallback = false;
  readonly sourceUrl = "https://statsapi.mlb.com";
  readonly capabilities = { schedule: true, liveScore: true, standings: true, results: true, sessions: false, telemetry: false };
  private readonly teamId: number;
  private readonly teamName: string;
  constructor(config: { teamId?: string; teamName?: string } = {}) {
    this.teamId = Number(config.teamId ?? ANGELS_ID);
    this.teamName = config.teamName ?? "Los Angeles Angels";
    this.id = `mlb-${this.teamId}`;
  }
  private isLive = false;

  get cacheSeconds(): number {
    return this.isLive ? 60 : 300;
  }

  async getSnapshot(now: Date): Promise<SportsProviderResult> {
    const start = new Date(now.getTime() - 14 * DAY);
    const end = new Date(now.getTime() + 30 * DAY);
    const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=${this.teamId}&startDate=${dayKey(start)}&endDate=${dayKey(end)}&hydrate=team`;
    const standingsUrl = `https://statsapi.mlb.com/api/v1/standings?leagueId=103&season=${now.getFullYear()}&hydrate=team`;
    const [payload, standingsPayload] = await Promise.all([fetchJson(url, this.cacheSeconds), fetchJson(standingsUrl, 3_600)]);
    const dates = isRecord(payload) ? records(payload.dates) : [];
    const events = dates.flatMap((item) => records(item.games).map(gameEvent).filter((event): event is SportsEvent => event !== null));
    this.isLive = events.some((event) => event.status === "live" || event.status === "delayed");
    return { events, standings: teamStanding(standingsPayload) };
  }
}
