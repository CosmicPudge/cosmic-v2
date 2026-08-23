import type { SportsEvent, SportsEventStatus, SportsTeam } from "@/core/contracts/Sports";
import type { SportsProvider, SportsProviderResult } from "./types";
import { date, fetchJson, isRecord, number, records, string } from "./types";

type SupportedLeague = "nba" | "mls";

interface LeagueConfig {
  sport: SupportedLeague;
  leaguePath: string;
  label: string;
  cacheSeconds: number;
}

function eventStatus(value: unknown): { status: SportsEventStatus; detail?: string } {
  const status = isRecord(value) ? value : undefined;
  const type = isRecord(status?.type) ? status.type : undefined;
  const state = string(type?.state) ?? string(status?.state);
  const detail = string(type?.detail) ?? string(status?.detail);
  const normalized = `${state ?? ""} ${detail ?? ""}`.toLowerCase();
  if (normalized.includes("postpon")) return { status: "postponed", ...(detail ? { detail } : {}) };
  if (normalized.includes("cancel")) return { status: "cancelled", ...(detail ? { detail } : {}) };
  if (normalized.includes("delay")) return { status: "delayed", ...(detail ? { detail } : {}) };
  if (state === "in") return { status: "live", ...(detail ? { detail } : {}) };
  if (state === "post") return { status: "final", ...(detail ? { detail } : {}) };
  if (normalized.includes("pregame")) return { status: "pregame", ...(detail ? { detail } : {}) };
  return { status: "scheduled", ...(detail ? { detail } : {}) };
}

function team(value: unknown): { side?: "home" | "away"; team?: SportsTeam } {
  if (!isRecord(value)) return {};
  const record = isRecord(value.team) ? value.team : undefined;
  const name = string(record?.displayName) ?? string(record?.name);
  if (!name) return {};
  const side = string(value.homeAway);
  const id = string(record?.id);
  const abbreviation = string(record?.abbreviation);
  const score = number(value.score);
  const recordSummary = records(value.records).map((item) => string(item.summary)).find(Boolean);
  return {
    ...(side === "home" || side === "away" ? { side } : {}),
    team: { name, ...(id ? { id } : {}), ...(abbreviation ? { abbreviation } : {}), ...(score !== undefined ? { score } : {}), ...(recordSummary ? { record: recordSummary } : {}) },
  };
}

export class EspnLeagueProvider implements SportsProvider {
  readonly id: string;
  readonly sport: SupportedLeague;
  readonly providerName = "ESPN Scoreboard";
  readonly official = false;
  readonly fallback = true;
  readonly sourceUrl = "https://site.api.espn.com";
  get capabilities() { return { schedule: true, liveScore: true, standings: true, results: true, sessions: false, telemetry: false }; }
  readonly cacheSeconds: number;
  private readonly config: LeagueConfig;

  constructor(config: LeagueConfig) {
    this.config = config;
    this.id = `espn-${config.sport}`;
    this.sport = config.sport;
    this.cacheSeconds = config.cacheSeconds;
  }

  async getSnapshot(now: Date): Promise<SportsProviderResult> {
    const year = now.getFullYear();
    const payload = await fetchJson(`https://site.api.espn.com/apis/site/v2/sports/${this.config.leaguePath}/scoreboard?limit=1000&dates=${year}`, this.cacheSeconds);
    const root = isRecord(payload) ? payload : undefined;
    const events = records(root?.events).flatMap((item): SportsEvent[] => {
      const upstreamId = string(item.id);
      const start = date(item.date);
      const competition = records(item.competitions)[0];
      if (!upstreamId || !start || !competition) return [];
      const competitors = records(competition.competitors).map(team);
      const homeTeam = competitors.find((entry) => entry.side === "home")?.team;
      const awayTeam = competitors.find((entry) => entry.side === "away")?.team;
      if (!homeTeam || !awayTeam) return [];
      const { status, detail } = eventStatus(competition.status ?? item.status);
      const venueRecord = isRecord(competition.venue) ? competition.venue : undefined;
      const venue = string(venueRecord?.fullName);
      const seasonType = isRecord(item.seasonType) ? string(item.seasonType.name) : undefined;
      const statusRecord = isRecord(competition.status) ? competition.status : undefined;
      const statusType = isRecord(statusRecord?.type) ? statusRecord.type : undefined;
      const period = number(statusType?.period) ?? number(statusRecord?.period);
      const clock = string(statusType?.displayClock) ?? string(statusRecord?.displayClock);
      const title = `${awayTeam.name} at ${homeTeam.name}`;
      return [{
        id: `${this.id}:${upstreamId}`,
        sport: this.sport,
        title,
        start,
        status,
        ...(detail ? { statusDetail: detail } : {}),
        homeTeam,
        awayTeam,
        ...(venue ? { venue } : {}),
        source: "espn",
        metadata: {
          competition: this.config.label,
          eventName: title,
          ...(seasonType ? { seasonType } : {}),
          ...(period !== undefined ? { period } : {}),
          ...(clock ? { clock } : {}),
        },
      }];
    });
    return { events, standings: await this.getStandings(year) };
  }

  private async getStandings(season: number) {
    try {
      const path = this.config.sport === "nba" ? "basketball/nba" : "soccer/usa.1";
      const payload = await fetchJson(`https://site.api.espn.com/apis/v2/sports/${path}/standings?season=${season}`, 900);
      const root = isRecord(payload) ? payload : {};
      const groups = records(root.children);
      return groups.flatMap((group) => {
        const conference = string(group.name) ?? string(group.abbreviation);
        const standings = isRecord(group.standings) ? group.standings : {};
        return records(standings.entries).flatMap((entry) => {
          const team = isRecord(entry.team) ? entry.team : {};
          const name = string(team.displayName) ?? string(team.name);
          if (!name) return [];
          const stats = Object.fromEntries(records(entry.stats).map((stat) => { const key = string(stat.name); const value = string(stat.displayValue) ?? (number(stat.value) !== undefined ? String(number(stat.value)) : undefined); return key && value ? [key, value] : undefined; }).filter((item): item is [string, string] => Boolean(item)));
          const wins = number(stats.wins);
          const losses = number(stats.losses);
          const rank = number(stats.playoffSeed) ?? number(statsrank(entry));
          const draws = number(stats.ties) ?? number(stats.draws);
          const points = number(stats.points);
          const goalDifference = number(stats.goalDifference) ?? number(stats.pointDifferential);
          return [{ id: `${this.config.sport}-standing-${string(team.id) ?? name}`, sport: this.config.sport, name, team: name, ...(rank !== undefined ? { rank } : {}), ...(wins !== undefined ? { wins } : {}), ...(losses !== undefined ? { losses } : {}), ...(draws !== undefined ? { draws } : {}), ...(points !== undefined ? { points } : {}), ...(goalDifference !== undefined ? { goalDifference } : {}), ...(wins !== undefined && losses !== undefined ? { record: `${wins}-${losses}${draws !== undefined ? `-${draws}` : ""}` } : {}), ...(stats.winPercent ? { percentage: stats.winPercent } : {}), ...(stats.gamesBehind ? { gamesBehind: stats.gamesBehind } : {}), ...(stats.streak ? { streak: stats.streak } : {}), ...(conference ? { conference } : {}), source: `espn-${this.config.sport}-standings` }];
        });
      });
    } catch { return []; }
  }
}

function statsrank(entry: Record<string, unknown>): number | undefined {
  return number(entry.seed) ?? number(entry.rank);
}

export const nbaProvider = new EspnLeagueProvider({ sport: "nba", leaguePath: "basketball/nba", label: "NBA", cacheSeconds: 300 });
export const mlsProvider = new EspnLeagueProvider({ sport: "mls", leaguePath: "soccer/usa.1", label: "MLS", cacheSeconds: 300 });
