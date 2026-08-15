import type { SportKind, SportsEvent, SportsEventStatus, SportsTeam } from "@/core/contracts/Sports";
import type { SportsProvider, SportsProviderResult } from "./types";
import { date, fetchJson, isRecord, number, records, string } from "./types";

interface TeamProviderConfig {
  id: string;
  sport: Extract<SportKind, "nfl" | "college-football">;
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
  readonly sport: Extract<SportKind, "nfl" | "college-football">;
  readonly cacheSeconds: number;
  readonly providerName = "ESPN Scoreboard";
  readonly official = false;
  readonly fallback = true;
  readonly sourceUrl = "https://www.espn.com";
  readonly capabilities = { schedule: true, liveScore: true, standings: false, results: true, sessions: false, telemetry: false };
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
        metadata: { competition: this.sport === "nfl" ? "NFL" : "College Football", ...(seasonType ? { seasonType } : {}) },
      }];
    });
    return { events };
  }
}

export const packersProvider = new EspnTeamProvider({ id: "nfl-packers-espn-fallback", sport: "nfl", teamId: "9", leaguePath: "football/nfl", cacheSeconds: 600 });
export const usuFootballProvider = new EspnTeamProvider({ id: "college-football-usu-espn-fallback", sport: "college-football", teamId: "328", leaguePath: "football/college-football", cacheSeconds: 900 });
