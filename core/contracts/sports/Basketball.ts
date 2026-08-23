import type { SportsDataSource, SportsLiveDataBase, SportsTeamRef } from "./Core";

export interface BasketballPlayerStat { id?: string; name: string; team?: string; minutes?: string; points?: number; rebounds?: number; assists?: number; fieldGoals?: string; threePointers?: string; freeThrows?: string; plusMinus?: number; }
export interface BasketballTeamStats { team: SportsTeamRef; stats: Record<string, string>; }
export interface BasketballPlay { id?: string; text: string; period?: number; clock?: string; teamAbbreviation?: string; scoreValue?: number; }
export interface BasketballLeader { category: string; name: string; value?: string; teamAbbreviation?: string; }
export interface BasketballLiveData extends SportsLiveDataBase { sport: "nba"; status?: string; period?: number; clock?: string; away: { team: SportsTeamRef; score: number; record?: string }; home: { team: SportsTeamRef; score: number; record?: string }; teamStats?: BasketballTeamStats[]; leaders?: BasketballLeader[]; players?: BasketballPlayerStat[]; plays?: BasketballPlay[]; }
export function basketballSource(status: "ok" | "degraded" | "unavailable", fetchedAt: string, stale = false): SportsDataSource { return { id: "espn-nba-summary", sport: "nba", name: "ESPN NBA summary", official: false, status, cacheSeconds: 15, fetchedAt, stale, capabilities: { schedule: true, liveScore: true, liveState: true, playByPlay: true, stats: true, results: true } }; }
