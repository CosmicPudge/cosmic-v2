import type { SportsEvent, SportsEventStatus, SportsStanding } from "@/core/contracts/Sports";
import type { SportsProvider, SportsProviderResult } from "./types";
import { fetchJson, isRecord, number, records, string } from "./types";

function utcDate(value: unknown): Date | undefined {
  const input = string(value);
  if (!input) return undefined;
  const parsed = new Date(input.endsWith("Z") ? input : `${input}Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function raceStatus(race: Record<string, unknown>, now: Date, start: Date): SportsEventStatus {
  const actualLaps = number(race.actual_laps);
  const scheduledLaps = number(race.scheduled_laps);
  const elapsedMs = now.getTime() - start.getTime();
  if (elapsedMs < 0) return "scheduled";
  if (elapsedMs > 18 * 60 * 60 * 1_000) return "final";
  if (actualLaps === undefined || actualLaps <= 0 || scheduledLaps === undefined || scheduledLaps <= 0) return "scheduled";
  if (actualLaps >= scheduledLaps) return "final";
  if (actualLaps < scheduledLaps) return "live";
  return "scheduled";
}

export class NascarProvider implements SportsProvider {
  readonly id = "nascar-official";
  readonly sport = "nascar" as const;
  readonly providerName = "NASCAR Official Schedule";
  readonly official = true;
  readonly fallback = false;
  readonly sourceUrl = "https://www.nascar.com";
  readonly capabilities = { schedule: true, liveScore: true, standings: true, results: true, sessions: true, telemetry: false };
  readonly cacheSeconds = 3_600;

  async getSnapshot(now: Date): Promise<SportsProviderResult> {
    const payload = await fetchJson(`https://cf.nascar.com/cacher/${now.getFullYear()}/1/race_list_basic.json`, this.cacheSeconds);
    const events = records(payload).flatMap((race): SportsEvent[] => {
      const id = number(race.race_id);
      const title = string(race.race_name);
      const sessions = records(race.schedule);
      const mainSession = sessions.find((session) => number(session.run_type) === 3);
      const start = utcDate(mainSession?.start_time_utc) ?? utcDate(race.race_date) ?? utcDate(race.date_scheduled);
      if (id === undefined || !title || !start) return [];
      const track = string(race.track_name);
      const broadcast = string(race.television_broadcaster);
      return [{
        id: `${this.id}:${id}`,
        sport: "nascar",
        title,
        start,
        status: raceStatus(race, now, start),
        ...(track ? { venue: track } : {}),
        ...(broadcast ? { broadcast } : {}),
        source: "nascar",
        metadata: { competition: "NASCAR Cup Series", eventName: title, ...(track ? { track } : {}), ...(number(race.scheduled_laps) !== undefined ? { detail: `${number(race.scheduled_laps)} laps` } : {}) },
      }];
    });
    return { events, standings: await this.getStandings(now.getFullYear()) };
  }

  private async getStandings(season: number): Promise<SportsStanding[]> {
    try {
      const payload = await fetchJson(`https://cf.nascar.com/cacher/${season}/1/standings.json`, 900);
      return records(payload).flatMap((entry) => {
        const driver = isRecord(entry.driver) ? entry.driver : entry;
        const name = string(driver.full_name) ?? string(driver.name) ?? [string(driver.first_name), string(driver.last_name)].filter(Boolean).join(" ");
        if (!name) return [];
        const rank = number(entry.position) ?? number(entry.rank); const points = number(entry.points); const wins = number(entry.wins);
        return [{ id: `nascar-standing-${string(driver.driver_id) ?? name}`, sport: "nascar" as const, name, driver: name, ...(rank !== undefined ? { rank } : {}), ...(points !== undefined ? { points } : {}), ...(wins !== undefined ? { wins } : {}), source: "nascar-official" }];
      });
    } catch { return []; }
  }
}
