import type { SportKind, SportsEvent, SportsEventStatus, SportsStanding, SportsTeam } from "@/core/contracts/Sports";
import type { SportsProvider, SportsProviderResult } from "./types";
import { date, fetchJson, isRecord, number, records, string } from "./types";

interface TeamProviderConfig {
  id: string;
  sport: Extract<SportKind, "nfl" | "nba" | "college-football">;
  teamId: string;
  leaguePath: string;
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

function competitor(value: unknown): { side?: "home" | "away"; team?: SportsTeam } {
  if (!isRecord(value)) return {};
  const teamRecord = isRecord(value.team) ? value.team : undefined;
  const name = string(teamRecord?.displayName) ?? string(teamRecord?.name);
  if (!name) return {};
  const id = string(teamRecord?.id);
  const abbreviation = string(teamRecord?.abbreviation);
  const score = number(value.score);
  const record = records(value.records).map((item) => string(item.summary)).find(Boolean);
  const side = string(value.homeAway);
  return {
    ...(side === "home" || side === "away" ? { side } : {}),
    team: { name, ...(id ? { id } : {}), ...(abbreviation ? { abbreviation } : {}), ...(score !== undefined ? { score } : {}), ...(record ? { record } : {}) },
  };
}

export class EspnTeamProvider implements SportsProvider {
  readonly id: string;
  readonly sport: Extract<SportKind, "nfl" | "nba" | "college-football">;
  readonly cacheSeconds: number;
  readonly providerName = "ESPN Scoreboard";
  readonly official = false;
  readonly fallback = true;
  readonly sourceUrl = "https://www.espn.com";
  get capabilities() { return { schedule: true, liveScore: true, standings: this.config.sport === "nfl", results: true, sessions: false, telemetry: false }; }
  private readonly config: TeamProviderConfig;

  constructor(config: TeamProviderConfig) {
    this.config = config;
    this.id = config.id;
    this.sport = config.sport;
    this.cacheSeconds = config.cacheSeconds;
  }

  async getSnapshot(now: Date): Promise<SportsProviderResult> {
    const year = now.getFullYear();
    const url = `https://site.api.espn.com/apis/site/v2/sports/${this.config.leaguePath}/teams/${this.config.teamId}/schedule?dates=${year}`;
    const payload = await fetchJson(url, this.cacheSeconds);
    const root = isRecord(payload) ? payload : undefined;
    const events = records(root?.events).flatMap((event): SportsEvent[] => {
      const id = string(event.id);
      const start = date(event.date);
      const competition = records(event.competitions)[0];
      if (!id || !start || !competition) return [];
      const competitors = records(competition.competitors).map(competitor);
      const homeTeam = competitors.find((item) => item.side === "home")?.team;
      const awayTeam = competitors.find((item) => item.side === "away")?.team;
      if (!homeTeam || !awayTeam) return [];
      const { status, detail } = eventStatus(competition.status ?? event.status);
      const venue = isRecord(competition.venue) ? string(competition.venue.fullName) : undefined;
      const seasonType = isRecord(event.seasonType) ? string(event.seasonType.name) : undefined;
      return [{
        id: `${this.id}:${id}`,
        sport: this.sport,
        title: `${awayTeam.name} at ${homeTeam.name}`,
        start,
        status,
        ...(detail ? { statusDetail: detail } : {}),
        homeTeam,
        awayTeam,
        ...(venue ? { venue } : {}),
        source: "espn",
        metadata: { competition: this.sport === "nfl" ? "NFL" : this.sport === "nba" ? "NBA" : "College Football", ...(seasonType ? { seasonType } : {}) },
      }];
    });
    return { events, ...(this.config.sport === "nfl" ? { standings: await this.getStandings(year) } : {}) };
  }

  private async getStandings(season: number): Promise<SportsStanding[]> {
    try {
      const payload = await fetchJson(`https://site.api.espn.com/apis/v2/sports/football/nfl/standings?season=${season}`, 900);
      const root = isRecord(payload) ? payload : {};
      return records(root.children).flatMap((conference) => {
        const conferenceName = string(conference.name) ?? string(conference.abbreviation);
        const divisions = records(conference.children);
        return (divisions.length ? divisions : [conference]).flatMap((division) => {
          const divisionName = string(division.name) ?? string(division.abbreviation);
          const standings = isRecord(division.standings) ? division.standings : {};
          return records(standings.entries).flatMap((entry) => {
            const team = isRecord(entry.team) ? entry.team : {};
            const name = string(team.displayName) ?? string(team.name);
            if (!name) return [];
            const stats = Object.fromEntries(records(entry.stats).map((stat) => { const key = string(stat.name); const value = string(stat.displayValue) ?? (number(stat.value) !== undefined ? String(number(stat.value)) : undefined); return key && value ? [key, value] : undefined; }).filter((item): item is [string, string] => Boolean(item)));
            const wins = number(stats.wins); const losses = number(stats.losses); const rank = number(stats.playoffSeed) ?? number(stats.rank);
            return [{ id: `nfl-standing-${string(team.id) ?? name}`, sport: "nfl" as const, name, team: name, ...(rank !== undefined ? { rank } : {}), ...(wins !== undefined ? { wins } : {}), ...(losses !== undefined ? { losses } : {}), ...(wins !== undefined && losses !== undefined ? { record: `${wins}-${losses}` } : {}), ...(conferenceName ? { conference: conferenceName } : {}), ...(divisionName ? { division: divisionName } : {}), source: "espn-nfl-standings" }];
          });
        });
      });
    } catch { return []; }
  }
}

export const packersProvider = new EspnTeamProvider({ id: "nfl-packers-espn-fallback", sport: "nfl", teamId: "9", leaguePath: "football/nfl", cacheSeconds: 600 });
export const usuFootballProvider = new EspnTeamProvider({ id: "college-football-usu-espn-fallback", sport: "college-football", teamId: "328", leaguePath: "football/college-football", cacheSeconds: 900 });
