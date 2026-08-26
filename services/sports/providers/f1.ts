import type { SportsEvent, SportsEventStatus, SportsStanding } from "@/core/contracts/Sports";
import type { SportsProvider, SportsProviderResult } from "./types";
import { date, fetchJson, isRecord, number, records, string } from "./types";

function status(value: unknown, now: Date, start: Date, end?: Date): SportsEventStatus {
  const statusRecord = isRecord(value) ? value : undefined;
  const type = isRecord(statusRecord?.type) ? statusRecord.type : undefined;
  const state = string(type?.state) ?? string(statusRecord?.state);
  const detail = string(type?.detail) ?? string(statusRecord?.detail);
  const normalizedState = state?.toLowerCase();
  const normalized = `${state ?? ""} ${detail ?? ""}`.toLowerCase();
  if (normalized.includes("cancel")) return "cancelled";
  if (normalized.includes("delay")) return "delayed";
  if (normalizedState === "in") return "live";
  if (normalizedState === "post") return "final";
  if (end && end < now) return "final";
  return start > now ? "scheduled" : "final";
}

function sessionKind(label: string): "practice" | "qualifying" | "sprint" | "race" {
  const normalized = label.toLowerCase();
  if (normalized.includes("qualifying") || normalized.includes("shootout")) return "qualifying";
  if (normalized.includes("sprint")) return "sprint";
  if (normalized.includes("practice") || normalized.includes("fp")) return "practice";
  return "race";
}

export class F1Provider implements SportsProvider {
  readonly id = "f1-espn-fallback";
  readonly sport = "f1" as const;
  readonly providerName = "ESPN Formula 1 + Jolpica standings";
  readonly official = false;
  readonly fallback = true;
  readonly sourceUrl = "https://www.espn.com/f1";
  readonly capabilities = { schedule: true, liveScore: true, standings: true, results: true, sessions: false, telemetry: false };
  readonly cacheSeconds = 900;

  async getSnapshot(now: Date): Promise<SportsProviderResult> {
    const payload = await fetchJson(`https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard?limit=1000&dates=${now.getFullYear()}`, this.cacheSeconds);
    const root = isRecord(payload) ? payload : undefined;
    const events = records(root?.events).flatMap((item): SportsEvent[] => {
      const id = string(item.id);
      const start = date(item.date);
      const competition = records(item.competitions)[0];
      const end = competition ? date(competition.endDate) : undefined;
      const title = string(item.name);
      if (!id || !start || !title) return [];
      const venueRecord = competition && isRecord(competition.venue) ? competition.venue : undefined;
      const address = venueRecord && isRecord(venueRecord.address) ? venueRecord.address : undefined;
      const detail = competition && isRecord(competition.status) && isRecord(competition.status.type) ? string(competition.status.type.detail) : undefined;
      return [{
        id: `${this.id}:${id}`,
        sport: "f1",
        title,
        start,
        ...(end ? { end } : {}),
        status: status(competition?.status, now, start, end),
        ...(detail ? { statusDetail: detail } : {}),
        ...(string(venueRecord?.fullName) ? { venue: string(venueRecord?.fullName) } : {}),
        source: "espn",
        metadata: {
          competition: "Formula 1",
          eventName: title,
          ...(string(venueRecord?.fullName) ? { circuit: string(venueRecord?.fullName) } : {}),
          ...(string(address?.country) ? { country: string(address?.country) } : {}),
        },
      }];
    });
    const sessions = await this.getWeekendSessions(now.getFullYear(), now);
    const authoritativeLiveEvents = events.filter(
      (event) => event.status === "live" || event.status === "delayed",
    );
    return {
      events: sessions.length
        ? [...sessions, ...authoritativeLiveEvents]
        : events,
      standings: await this.getStandings(now.getFullYear()),
    };
  }

  private async getWeekendSessions(season: number, now: Date): Promise<SportsEvent[]> {
    try {
      const payload = await fetchJson(`https://api.jolpi.ca/ergast/f1/${season}.json`, 900);
      const raceTable = isRecord(payload) && isRecord(payload.MRData) && isRecord(payload.MRData.RaceTable) ? payload.MRData.RaceTable : undefined;
      const races = records(raceTable?.Races);
      return races.flatMap((race) => {
        const round = string(race.round); const raceName = string(race.raceName); const circuit = isRecord(race.Circuit) ? race.Circuit : {};
        if (!round || !raceName) return [];
        const weekend = [{ label: "Practice 1", value: isRecord(race.FirstPractice) ? race.FirstPractice : undefined }, { label: "Practice 2", value: isRecord(race.SecondPractice) ? race.SecondPractice : undefined }, { label: "Practice 3", value: isRecord(race.ThirdPractice) ? race.ThirdPractice : undefined }, { label: "Sprint", value: isRecord(race.Sprint) ? race.Sprint : undefined }, { label: "Qualifying", value: isRecord(race.Qualifying) ? race.Qualifying : undefined }, { label: "Race", value: string(race.date) ? { date: race.date, time: race.time } : undefined }];
        return weekend.flatMap(({ label, value }) => { const dateValue = value && string(value.date); if (!dateValue) return []; const start = new Date(`${dateValue}T${string(value?.time) ?? "00:00:00Z"}`); if (Number.isNaN(start.getTime())) return []; const kind = sessionKind(label); const title = `${raceName} · ${label}`; return [{ id: `jolpica-f1:${season}:${round}:${kind}`, sport: "f1" as const, title, start, status: status(undefined, now, start), venue: string(circuit.circuitName), source: "jolpica", provider: "jolpica", providerName: "Jolpica F1", official: false, fallback: true, sourceUrl: "https://api.jolpi.ca/docs/", metadata: { competition: raceName, eventName: title, sessionType: label, sessionKind: kind, circuit: string(circuit.circuitName), country: isRecord(circuit.Location) ? string(circuit.Location.country) : undefined } }]; });
      });
    } catch { return []; }
  }

  private async getStandings(season: number): Promise<SportsStanding[]> {
    try {
      const [driverPayload, constructorPayload] = await Promise.all([
        fetchJson(`https://api.jolpi.ca/ergast/f1/${season}/driverstandings.json`, 900),
        fetchJson(`https://api.jolpi.ca/ergast/f1/${season}/constructorstandings.json`, 900),
      ]);
      const driverRoot = isRecord(driverPayload) && isRecord(driverPayload.MRData) ? driverPayload.MRData : undefined;
      const constructorRoot = isRecord(constructorPayload) && isRecord(constructorPayload.MRData) ? constructorPayload.MRData : undefined;
      const driverTable = driverRoot && isRecord(driverRoot.StandingsTable) ? driverRoot.StandingsTable : undefined;
      const constructorTable = constructorRoot && isRecord(constructorRoot.StandingsTable) ? constructorRoot.StandingsTable : undefined;
      const driverLists = records(driverTable?.StandingsLists);
      const constructorLists = records(constructorTable?.StandingsLists);
      const driverStandings = records(driverLists[0]?.DriverStandings).flatMap((item): SportsStanding[] => {
        const driver = isRecord(item.Driver) ? item.Driver : undefined;
        const name = `${string(driver?.givenName) ?? ""} ${string(driver?.familyName) ?? ""}`.trim();
        const points = number(item.points);
        const rank = number(item.position);
        const wins = number(item.wins);
        const constructor = records(item.Constructors)[0];
        const constructorName = isRecord(constructor) ? string(constructor.name) : undefined;
        return name ? [{ id: `f1-driver-standing-${string(driver?.driverId) ?? name}`, sport: "f1", name, driver: name, ...(constructorName ? { team: constructorName } : {}), ...(rank !== undefined ? { rank } : {}), ...(points !== undefined ? { points } : {}), ...(wins !== undefined ? { wins } : {}), source: "jolpica" }] : [];
      });
      const constructorStandings = records(constructorLists[0]?.ConstructorStandings).flatMap((item): SportsStanding[] => {
        const constructor = isRecord(item.Constructor) ? item.Constructor : undefined;
        const name = string(constructor?.name);
        const points = number(item.points);
        const rank = number(item.position);
        const wins = number(item.wins);
        return name ? [{ id: `f1-constructor-standing-${string(constructor?.constructorId) ?? name}`, sport: "f1", name, team: name, ...(rank !== undefined ? { rank } : {}), ...(points !== undefined ? { points } : {}), ...(wins !== undefined ? { wins } : {}), source: "jolpica" }] : [];
      });
      return [...driverStandings, ...constructorStandings];
    } catch {
      return [];
    }
  }
}
