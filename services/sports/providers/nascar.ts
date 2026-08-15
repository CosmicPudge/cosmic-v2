import type { SportsEvent, SportsEventStatus } from "@/core/contracts/Sports";
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
  readonly capabilities = { schedule: true, liveScore: false, standings: false, results: true, sessions: true, telemetry: false };
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
        metadata: { competition: "NASCAR Cup Series", eventName: title, ...(track ? { track } : {}) },
      }];
    });
    return { events };
  }
}
