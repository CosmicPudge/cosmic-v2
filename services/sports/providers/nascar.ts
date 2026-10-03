import type { SportsEvent, SportsStanding } from "@/core/contracts/Sports";
import type { SportsProvider, SportsProviderResult } from "./types";
import { fetchJson, isRecord, number, records, string } from "./types";

function utcDate(value: unknown): Date | undefined {
  const input = string(value);
  if (!input) return undefined;
  const parsed = new Date(input.endsWith("Z") ? input : `${input}Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function resolveNascarRaceState(race: Record<string, unknown>, now: Date, start: Date) {
  const actualLaps = number(race.actual_laps);
  const scheduledLaps = number(race.scheduled_laps);
  const providerComplete = scheduledLaps !== undefined && scheduledLaps > 0 && actualLaps !== undefined && actualLaps >= scheduledLaps;
  const expectedEnd = new Date(start.getTime() + 6 * 60 * 60_000);
  if (providerComplete || now.getTime() - start.getTime() > 18 * 60 * 60_000) return { state: "complete" as const, status: "final" as const, statusSource: "provider" as const, inferredLive: false, expectedEnd };
  if (actualLaps !== undefined && actualLaps > 0) return { state: "live" as const, status: "live" as const, statusSource: "provider" as const, inferredLive: false, expectedEnd };
  if (now < start) return { state: "scheduled" as const, status: "scheduled" as const, statusSource: "provider" as const, inferredLive: false, expectedEnd };
  if (now < expectedEnd) return { state: "live" as const, status: "live" as const, statusSource: "inferred" as const, inferredLive: true, expectedEnd };
  return { state: "unknown" as const, status: "final" as const, statusSource: "inferred" as const, inferredLive: false, expectedEnd };
}

export function nascarSessionKind(session: Record<string, unknown>): "practice" | "qualifying" | "race" | null {
  const runType = number(session.run_type);
  if (runType === 3) return "race";
  if (runType === 2) return "qualifying";
  if (runType === 1) return "practice";
  const label = `${string(session.name) ?? ""} ${string(session.session_name) ?? ""}`.toLowerCase();
  if (label.includes("qualif")) return "qualifying";
  if (label.includes("practice") || label.includes("warm")) return "practice";
  return null;
}

function resolveNascarSessionState(session: Record<string, unknown>, now: Date, start: Date) {
  const kind = nascarSessionKind(session);
  if (kind === "race") return resolveNascarRaceState(session, now, start);
  const expectedEnd = new Date(start.getTime() + 2 * 60 * 60_000);
  if (now < start) return { state: "scheduled" as const, status: "scheduled" as const, statusSource: "provider" as const, inferredLive: false, expectedEnd };
  if (now < expectedEnd) return { state: "live" as const, status: "live" as const, statusSource: "inferred" as const, inferredLive: true, expectedEnd };
  return { state: "complete" as const, status: "final" as const, statusSource: "inferred" as const, inferredLive: false, expectedEnd };
}

export class NascarProvider implements SportsProvider {
  readonly id = "nascar-official";
  readonly sport = "nascar" as const;
  readonly providerName = "NASCAR Official Schedule";
  readonly official = true;
  readonly fallback = false;
  readonly sourceUrl = "https://www.nascar.com";
  readonly capabilities = { schedule: true, liveScore: true, standings: true, results: true, sessions: true, telemetry: false };
  readonly cacheSeconds = 30;

  async getSnapshot(now: Date): Promise<SportsProviderResult> {
    const payload = await fetchJson(`https://cf.nascar.com/cacher/${now.getFullYear()}/1/race_list_basic.json`, this.cacheSeconds);
    const events = records(payload).flatMap((race): SportsEvent[] => {
      const id = number(race.race_id);
      const title = string(race.race_name);
      const sessions = records(race.schedule);
      const mainSession = sessions.find((session) => nascarSessionKind(session) === "race");
      const start = utcDate(mainSession?.start_time_utc) ?? utcDate(race.race_date) ?? utcDate(race.date_scheduled);
      if (id === undefined || !title || !start) return [];
      const track = string(race.track_name);
      const trackId = string(race.track_id) ?? (number(race.track_id) !== undefined ? String(number(race.track_id)) : undefined);
      const location = [string(race.track_city), string(race.track_state), string(race.track_country)].filter(Boolean).join(", ");
      const broadcast = string(race.television_broadcaster);
      const raceEvents = sessions.flatMap((session): SportsEvent[] => {
        const sessionKind = nascarSessionKind(session);
        const sessionStart = utcDate(session.start_time_utc) ?? (sessionKind === "race" ? start : undefined);
        if (!sessionKind || !sessionStart) return [];
        const state = resolveNascarSessionState({ ...race, ...session }, now, sessionStart);
        const label = sessionKind === "race" ? "Race" : sessionKind === "qualifying" ? "Qualifying" : "Practice";
        return [{
          id: `${this.id}:${id}:${sessionKind}`,
          sport: "nascar",
          title: `${title} · ${label}`,
          start: sessionStart,
          status: state.status,
          ...(track ? { venue: track } : {}),
          ...(broadcast ? { broadcast } : {}),
          source: "nascar",
          metadata: { competition: "NASCAR Cup Series", eventName: title, sessionType: label, sessionKind, normalizedState: state.state, statusSource: state.statusSource, inferredLive: state.inferredLive, expectedEnd: state.expectedEnd.toISOString(), staleAfter: new Date(now.getTime() + this.cacheSeconds * 1_000).toISOString(), lastProviderRefresh: now.toISOString(), ...(track ? { track } : {}), ...(trackId ? { trackId } : {}), ...(location ? { location } : {}), ...(string(race.track_type) ? { trackType: string(race.track_type), trackConfiguration: string(race.track_type) } : {}), ...(sessionKind === "race" && number(race.scheduled_laps) !== undefined ? { laps: number(race.scheduled_laps), detail: `${number(race.scheduled_laps)} laps` } : {}), ...(string(race.race_distance) ? { raceDistance: string(race.race_distance) } : {}) },
        }];
      });
      return raceEvents.length ? raceEvents : [{
        id: `${this.id}:${id}`,
        sport: "nascar",
        title,
        start,
        status: resolveNascarRaceState(race, now, start).status,
        ...(track ? { venue: track } : {}),
        ...(broadcast ? { broadcast } : {}),
        source: "nascar",
        metadata: { competition: "NASCAR Cup Series", eventName: title, sessionType: "Race", sessionKind: "race", normalizedState: resolveNascarRaceState(race, now, start).state, statusSource: resolveNascarRaceState(race, now, start).statusSource, inferredLive: resolveNascarRaceState(race, now, start).inferredLive, expectedEnd: resolveNascarRaceState(race, now, start).expectedEnd.toISOString(), staleAfter: new Date(now.getTime() + this.cacheSeconds * 1_000).toISOString(), lastProviderRefresh: now.toISOString(), ...(track ? { track } : {}), ...(trackId ? { trackId } : {}), ...(location ? { location } : {}), ...(number(race.scheduled_laps) !== undefined ? { laps: number(race.scheduled_laps), detail: `${number(race.scheduled_laps)} laps` } : {}) },
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
