import type { SportsDirectoryEntry } from "@/services/sports/directory";
import type { SportsStanding } from "@/core/contracts/Sports";
import type { SportsProviderResult } from "../types";
import { sportsDirectoryBySport } from "@/services/sports/directory";
import { fetchJson } from "../types";
import { getCollegeFootballDirectory } from "../college-football-directory";
import { EspnTeamProvider } from "../espn-team";
import { espnFootballCoreEventUrl, espnFootballRankingsUrl, espnFootballScoreboardUrl, espnFootballSummaryUrl, type EspnFootballLeague } from "./endpoints";
import type { FootballProvider } from "./types";

export class EspnFootballProvider implements FootballProvider {
  readonly provider = "espn" as const;
  readonly league: EspnFootballLeague;
  readonly id: string;
  readonly sport: EspnFootballLeague;
  readonly cacheSeconds: number;
  readonly providerName = "ESPN Football";
  readonly official = false;
  readonly fallback = false;
  readonly sourceUrl = "https://site.api.espn.com";
  readonly capabilities = { schedule: true, liveScore: true, liveState: true, playByPlay: true, standings: true, results: true, stats: true, sessions: false, telemetry: false };
  private readonly teamProvider: EspnTeamProvider;

  constructor(league: EspnFootballLeague, teamId: string) {
    this.league = league;
    this.sport = league;
    this.id = `espn-football-${league}-${teamId}`;
    this.cacheSeconds = league === "nfl" ? 600 : 900;
    this.teamProvider = new EspnTeamProvider({ id: `espn-${league}-${teamId}`, sport: league, teamId, leaguePath: league === "nfl" ? "football/nfl" : "football/college-football", cacheSeconds: league === "nfl" ? 600 : 900 });
  }

  async getTeams(): Promise<SportsDirectoryEntry[]> {
    return this.league === "college-football" ? getCollegeFootballDirectory() : sportsDirectoryBySport("nfl");
  }

  async getTeam(teamId: string) { return (await this.getTeams()).find((team) => team.providerId === teamId); }
  async getTeamSchedule(_teamId: string, now = new Date()) { return (await this.teamProvider.getSnapshot(now)).events; }
  async getSnapshot(now = new Date()): Promise<SportsProviderResult> { return this.teamProvider.getSnapshot(now); }
  async getTeamSnapshot(_teamId: string, now = new Date()) { return this.getSnapshot(now); }
  async getScoreboard(dates?: string) { return fetchJson(espnFootballScoreboardUrl(this.league, dates), 10); }
  async getEventSummary(eventId: string) { return fetchJson(espnFootballSummaryUrl(this.league, eventId), 5); }
  async getPlayByPlay(eventId: string) { return fetchJson(espnFootballCoreEventUrl(this.league, eventId, "plays", 500), 2); }
  async getDrives(eventId: string) { return fetchJson(espnFootballCoreEventUrl(this.league, eventId, "drives", 100), 3); }
  async getRankings(): Promise<SportsStanding[]> {
    if (this.league !== "college-football") return [];
    const payload = await fetchJson(espnFootballRankingsUrl(new Date().getFullYear()), 900);
    const root = payload && typeof payload === "object" ? payload as { rankings?: unknown } : {};
    const polls = Array.isArray(root.rankings) ? root.rankings : [];
    return polls.flatMap((poll) => {
      if (!poll || typeof poll !== "object") return [];
      const record = poll as { name?: unknown; ranks?: unknown };
      const pollName = typeof record.name === "string" ? record.name : "College Football rankings";
      return Array.isArray(record.ranks) ? record.ranks.flatMap((rank) => {
        if (!rank || typeof rank !== "object") return [];
        const item = rank as { current?: unknown; team?: { id?: unknown; displayName?: unknown; name?: unknown }; record?: { summary?: unknown } };
        const name = typeof item.team?.displayName === "string" ? item.team.displayName : typeof item.team?.name === "string" ? item.team.name : undefined;
        const current = typeof item.current === "number" ? item.current : undefined;
        if (!name || current === undefined) return [];
        return [{ id: `espn-cfb-ranking-${String(item.team?.id ?? name)}-${pollName}`, sport: "college-football" as const, name, team: name, rank: current, ...(typeof item.record?.summary === "string" ? { record: item.record.summary } : {}), source: "espn-cfb-rankings" }];
      }) : [];
    });
  }
}
