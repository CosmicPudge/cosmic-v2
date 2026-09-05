import type { SportsDirectoryEntry } from "@/services/sports/directory";
import type { SportsEvent, SportsStanding } from "@/core/contracts/Sports";
import type { SportsProvider, SportsProviderResult } from "../types";

export type FootballLeague = "nfl" | "college-football";

export interface FootballProvider extends SportsProvider {
  readonly provider: "espn";
  readonly league: FootballLeague;
  getTeams(): Promise<SportsDirectoryEntry[]>;
  getTeam(teamId: string): Promise<SportsDirectoryEntry | undefined>;
  getTeamSchedule(teamId: string, now?: Date): Promise<SportsEvent[]>;
  getScoreboard(dates?: string): Promise<unknown>;
  getEventSummary(eventId: string): Promise<unknown>;
  getPlayByPlay(eventId: string): Promise<unknown>;
  getDrives(eventId: string): Promise<unknown>;
  getRankings(): Promise<SportsStanding[]>;
  getSnapshot(now: Date): Promise<SportsProviderResult>;
  getTeamSnapshot(teamId: string, now?: Date): Promise<SportsProviderResult>;
}
