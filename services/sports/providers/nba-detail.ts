import type { BasketballLiveData, BasketballLeader, BasketballPlay, BasketballPlayerStat, BasketballTeamStats } from "@/core/contracts/sports/Basketball";
import type { SportsTeamRef } from "@/core/contracts/sports/Core";
import { fetchJson, isRecord, number, records, string } from "./types";

const ESPN_SUMMARY = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary";

function ref(value: unknown): SportsTeamRef {
  const team = isRecord(value) ? value : {};
  const id = string(team.id);
  const name = string(team.displayName) ?? string(team.name) ?? "Unknown team";
  const abbreviation = string(team.abbreviation);
  return { name, ...(id ? { id } : {}), ...(abbreviation ? { abbreviation } : {}) };
}

function display(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (isRecord(value)) return string(value.displayValue) ?? string(value.value);
  return undefined;
}

function normalizePlayer(value: Record<string, unknown>, team?: string): BasketballPlayerStat | undefined {
  const athlete = isRecord(value.athlete) ? value.athlete : {};
  const name = string(athlete.displayName) ?? string(athlete.fullName) ?? string(value.name);
  if (!name) return undefined;
  const values = records(value.statistics).map(display);
  const numeric = (index: number) => { const parsed = Number(values[index]); return Number.isFinite(parsed) ? parsed : undefined; };
  return { name, ...(string(athlete.id) ? { id: string(athlete.id) } : {}), ...(team ? { team } : {}), ...(values[0] ? { minutes: values[0] } : {}), ...(numeric(1) !== undefined ? { points: numeric(1) } : {}), ...(numeric(2) !== undefined ? { rebounds: numeric(2) } : {}), ...(numeric(3) !== undefined ? { assists: numeric(3) } : {}), ...(values[4] ? { fieldGoals: values[4] } : {}), ...(values[5] ? { threePointers: values[5] } : {}), ...(values[6] ? { freeThrows: values[6] } : {}), ...(numeric(10) !== undefined ? { plusMinus: numeric(10) } : {}) };
}

export async function getNBAEventDetail(eventId: string, cacheSeconds = 15): Promise<BasketballLiveData> {
  const payload = await fetchJson(`${ESPN_SUMMARY}?event=${encodeURIComponent(eventId)}`, cacheSeconds);
  const root = isRecord(payload) ? payload : {};
  const header = isRecord(root.header) ? root.header : {};
  const competition = records(header.competitions)[0] ?? records(root.competitions)[0] ?? {};
  const normalized = records(competition.competitors).map((entry) => {
    const side = string(entry.homeAway);
    const record = records(entry.records).map((item) => string(item.summary)).find(Boolean);
    return { side, team: ref(entry.team), score: number(entry.score) ?? 0, record };
  });
  const away = normalized.find((entry) => entry.side === "away") ?? normalized[0];
  const home = normalized.find((entry) => entry.side === "home") ?? normalized[1];
  if (!away || !home) throw new Error("NBA summary did not contain both teams.");
  const status = isRecord(competition.status) ? competition.status : {};
  const statusType = isRecord(status.type) ? status.type : {};
  const boxscore = isRecord(root.boxscore) ? root.boxscore : {};
  const teamStats = records(boxscore.teams).flatMap((entry): BasketballTeamStats[] => {
    const stats = Object.fromEntries(records(entry.statistics).map((stat) => { const name = string(stat.name) ?? string(stat.label); const value = display(stat); return name && value ? [name, value] : undefined; }).filter((item): item is [string, string] => Boolean(item)));
    return Object.keys(stats).length ? [{ team: ref(entry.team), stats }] : [];
  });
  const players = records(boxscore.players).flatMap((entry) => {
    const team = string(isRecord(entry.team) ? entry.team.abbreviation : undefined);
    return records(entry.statistics).map((player) => normalizePlayer(player, team)).filter((item): item is BasketballPlayerStat => Boolean(item));
  });
  const leaders = records(root.leaders).flatMap((group): BasketballLeader[] => {
    const category = string(group.name) ?? string(group.displayName);
    const leader = records(group.leaders)[0];
    const athlete = leader && isRecord(leader.athlete) ? leader.athlete : {};
    const name = string(athlete.displayName) ?? string(athlete.fullName);
    if (!category || !name) return [];
    const team = leader && isRecord(leader.team) ? string(leader.team.abbreviation) : undefined;
    return [{ category, name, ...(string(leader?.displayValue) ? { value: string(leader.displayValue) } : {}), ...(team ? { teamAbbreviation: team } : {}) }];
  });
  const plays = records(root.plays).slice(-30).reverse().flatMap((play): BasketballPlay[] => {
    const text = string(play.text) ?? string(play.description);
    if (!text) return [];
    const clock = isRecord(play.clock) ? string(play.clock.displayValue) : undefined;
    const team = isRecord(play.team) ? string(play.team.abbreviation) : undefined;
    return [{ ...(string(play.id) ? { id: string(play.id) } : {}), text, ...(number(play.period) !== undefined ? { period: number(play.period) } : {}), ...(clock ? { clock } : {}), ...(team ? { teamAbbreviation: team } : {}), ...(number(play.scoreValue) !== undefined ? { scoreValue: number(play.scoreValue) } : {}) }];
  });
  const generatedAt = new Date().toISOString();
  return { eventId, sport: "nba", generatedAt, stale: false, sources: [{ id: "espn-nba-summary", sport: "nba", name: "ESPN NBA summary", official: false, status: "ok", cacheSeconds, fetchedAt: generatedAt, capabilities: { schedule: true, liveScore: true, liveState: true, playByPlay: true, stats: true, results: true } }], status: string(statusType.detail) ?? string(status.detail), ...(number(statusType.period) !== undefined ? { period: number(statusType.period) } : {}), ...(string(statusType.displayClock) ? { clock: string(statusType.displayClock) } : {}), away: { team: away.team, score: away.score, ...(away.record ? { record: away.record } : {}) }, home: { team: home.team, score: home.score, ...(home.record ? { record: home.record } : {}) }, ...(teamStats.length ? { teamStats } : {}), ...(leaders.length ? { leaders } : {}), ...(players.length ? { players } : {}), ...(plays.length ? { plays } : {}) };
}
