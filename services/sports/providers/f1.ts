import type { SportsEvent, SportsEventStatus, SportsStanding } from "@/core/contracts/Sports";
import type { SportsProvider, SportsProviderResult } from "./types";
import { date, fetchJson, isRecord, number, records, string } from "./types";

export const F1_SESSION_DURATION_MS = {
  practice: 90 * 60_000,
  qualifying: 120 * 60_000,
  sprint: 120 * 60_000,
  race: 180 * 60_000,
} as const;

const F1_CIRCUIT_TIMEZONES: Array<{ timezone: string; aliases: string[] }> = [
  { timezone: "Australia/Melbourne", aliases: ["albert park", "melbourne", "australia"] },
  { timezone: "Asia/Shanghai", aliases: ["shanghai", "china"] },
  { timezone: "Asia/Tokyo", aliases: ["suzuka", "japan"] },
  { timezone: "America/New_York", aliases: ["miami"] },
  { timezone: "America/Toronto", aliases: ["gilles villeneuve", "montreal", "canada"] },
  { timezone: "Europe/Monaco", aliases: ["monaco"] },
  { timezone: "Europe/Madrid", aliases: ["barcelona", "catalunya", "madrid", "spain"] },
  { timezone: "Europe/Vienna", aliases: ["red bull ring", "spielberg", "austria"] },
  { timezone: "Europe/London", aliases: ["silverstone", "great britain", "united kingdom"] },
  { timezone: "Europe/Brussels", aliases: ["spa francorchamps", "spa", "belgium"] },
  { timezone: "Europe/Budapest", aliases: ["hungaroring", "budapest", "hungary"] },
  { timezone: "Europe/Rome", aliases: ["autodromo nazionale monza", "monza", "italy"] },
  { timezone: "Asia/Baku", aliases: ["baku", "azerbaijan"] },
  { timezone: "Asia/Kuala_Lumpur", aliases: ["sepang international circuit", "sepang", "malaysia"] },
  { timezone: "Asia/Singapore", aliases: ["marina bay street circuit", "marina bay", "singapore"] },
  { timezone: "America/Chicago", aliases: ["circuit of the americas", "cota", "austin", "united states"] },
  { timezone: "America/Mexico_City", aliases: ["autodromo hermanos rodriguez", "hermanos rodriguez", "mexico city", "mexico"] },
  { timezone: "America/Sao_Paulo", aliases: ["autodromo jose carlos pace", "jose carlos pace", "interlagos", "sao paulo", "brazil"] },
  { timezone: "America/Los_Angeles", aliases: ["las vegas strip circuit", "las vegas", "vegas"] },
  { timezone: "Asia/Qatar", aliases: ["lusail international circuit", "lusail", "qatar"] },
  { timezone: "Asia/Dubai", aliases: ["yas marina circuit", "yas marina", "abu dhabi"] },
];

function normalized(value?: string) { return value?.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() ?? ""; }

export function resolveF1Timezone(circuit?: string, country?: string) {
  const circuitText = normalized(circuit);
  const circuitMatch = F1_CIRCUIT_TIMEZONES.find(({ aliases }) => aliases.some((alias) => circuitText.includes(normalized(alias))));
  if (circuitMatch) return circuitMatch.timezone;
  const haystack = normalized(country);
  return F1_CIRCUIT_TIMEZONES.find(({ aliases }) => aliases.some((alias) => haystack.includes(normalized(alias))))?.timezone;
}

function providerStatus(value: unknown, now: Date, start: Date, end?: Date): SportsEventStatus {
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
  if (normalized.includes("sprint qualifying") || normalized.includes("sprint shootout")) return "qualifying";
  if (normalized.includes("qualifying") || normalized.includes("shootout")) return "qualifying";
  if (normalized.includes("sprint")) return "sprint";
  if (normalized.includes("practice") || normalized.includes("fp")) return "practice";
  return "race";
}

export function f1SessionKey(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes("practice 1") || normalized.includes("fp1")) return "practice1";
  if (normalized.includes("practice 2") || normalized.includes("fp2")) return "practice2";
  if (normalized.includes("practice 3") || normalized.includes("fp3")) return "practice3";
  if (normalized.includes("sprint qualifying") || normalized.includes("sprint shootout")) return "sprintQualifying";
  if (normalized.includes("qualifying") || normalized.includes("shootout")) return "qualifying";
  if (normalized.includes("sprint")) return "sprint";
  return "race";
}

function localDateToUtc(dateValue: string, timeValue: string, timezone: string) {
  const naive = new Date(`${dateValue}T${timeValue}Z`);
  if (Number.isNaN(naive.getTime())) return naive;
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(naive).reduce<Record<string, string>>((result, part) => {
    if (part.type !== "literal") result[part.type] = part.value;
    return result;
  }, {});
  const renderedAsUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
  return new Date(naive.getTime() - (renderedAsUtc - naive.getTime()));
}

export function parseF1SessionStart(dateValue: string, timeValue: string | undefined, country?: string, circuit?: string) {
  const time = timeValue?.trim() || "00:00:00";
  const raw = `${dateValue}T${time}`;
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(time)) return new Date(raw);
  const timezone = resolveF1Timezone(circuit, country);
  return timezone ? localDateToUtc(dateValue, time, timezone) : new Date(`${raw}Z`);
}

export function resolveF1SessionState(input: { start: Date; now: Date; kind: "practice" | "qualifying" | "sprint" | "race"; providerStatus?: SportsEventStatus; providerEnd?: Date }) {
  const expectedEnd = input.providerEnd ?? new Date(input.start.getTime() + F1_SESSION_DURATION_MS[input.kind]);
  const explicitLive = input.providerStatus === "live" || input.providerStatus === "delayed";
  const explicitComplete = input.providerStatus === "final" || input.providerStatus === "cancelled" || input.providerStatus === "postponed";
  if (explicitLive) return { state: "live" as const, status: input.providerStatus!, statusSource: "provider" as const, inferredLive: false, expectedEnd };
  if (explicitComplete) return { state: "complete" as const, status: input.providerStatus!, statusSource: "provider" as const, inferredLive: false, expectedEnd };
  if (input.now < input.start) return { state: "scheduled" as const, status: "scheduled" as const, statusSource: "inferred" as const, inferredLive: false, expectedEnd };
  if (input.now < expectedEnd) return { state: "live" as const, status: "live" as const, statusSource: "inferred" as const, inferredLive: true, expectedEnd };
  return { state: "complete" as const, status: "final" as const, statusSource: "inferred" as const, inferredLive: false, expectedEnd };
}

export class F1Provider implements SportsProvider {
  readonly id = "f1-espn-fallback";
  readonly sport = "f1" as const;
  readonly providerName = "ESPN Formula 1 + Jolpica standings";
  readonly official = false;
  readonly fallback = true;
  readonly sourceUrl = "https://www.espn.com/f1";
  readonly capabilities = { schedule: true, liveScore: true, standings: true, results: true, sessions: false, telemetry: false };
  readonly cacheSeconds = 30;

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
        status: providerStatus(competition?.status, now, start, end),
        ...(detail ? { statusDetail: detail } : {}),
        broadcast: "Apple TV",
        ...(string(venueRecord?.fullName) ? { venue: string(venueRecord?.fullName) } : {}),
        source: "espn",
        metadata: {
          competition: "Formula 1",
          eventName: title,
          ...(string(venueRecord?.fullName) ? { circuit: string(venueRecord?.fullName) } : {}),
          ...(string(address?.city) || string(address?.country) ? { location: [string(address?.city), string(address?.country)].filter(Boolean).join(", ") } : {}),
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
      const payload = await fetchJson(`https://api.jolpi.ca/ergast/f1/${season}.json`, this.cacheSeconds);
      const raceTable = isRecord(payload) && isRecord(payload.MRData) && isRecord(payload.MRData.RaceTable) ? payload.MRData.RaceTable : undefined;
      const races = records(raceTable?.Races);
      return races.flatMap((race) => {
        const round = string(race.round); const raceName = string(race.raceName); const circuit = isRecord(race.Circuit) ? race.Circuit : {};
        if (!round || !raceName) return [];
        const location = isRecord(circuit.Location) ? [string(circuit.Location.locality), string(circuit.Location.country)].filter(Boolean).join(", ") : undefined;
        const circuitId = string(circuit.circuitId);
        const sprintQualifying = isRecord(race.SprintQualifying) ? race.SprintQualifying : isRecord(race.SprintShootout) ? race.SprintShootout : undefined;
        const weekend = [{ label: "Practice 1", value: isRecord(race.FirstPractice) ? race.FirstPractice : undefined }, { label: "Practice 2", value: isRecord(race.SecondPractice) ? race.SecondPractice : undefined }, { label: "Practice 3", value: isRecord(race.ThirdPractice) ? race.ThirdPractice : undefined }, { label: "Sprint Qualifying", value: sprintQualifying }, { label: "Sprint", value: isRecord(race.Sprint) ? race.Sprint : undefined }, { label: "Qualifying", value: isRecord(race.Qualifying) ? race.Qualifying : undefined }, { label: "Race", value: string(race.date) ? { date: race.date, time: race.time } : undefined }];
        return weekend.flatMap(({ label, value }) => { const dateValue = value && string(value.date); if (!dateValue) return []; const country = isRecord(circuit.Location) ? string(circuit.Location.country) : undefined; const circuitName = string(circuit.circuitName); const start = parseF1SessionStart(dateValue, string(value?.time), country, circuitName); if (Number.isNaN(start.getTime())) return []; const kind = sessionKind(label); const sessionId = f1SessionKey(label); const state = resolveF1SessionState({ start, now, kind }); const title = `${raceName} · ${label}`; const timezone = resolveF1Timezone(circuitName, country); return [{ id: `jolpica-f1:${season}:${round}:${sessionId}`, sport: "f1" as const, title, start, status: state.status, venue: circuitName, broadcast: "Apple TV", source: "jolpica", provider: "jolpica", providerName: "Jolpica F1", official: false, fallback: true, sourceUrl: "https://api.jolpi.ca/docs/", metadata: { competition: raceName, eventName: title, sessionType: label, sessionKind: kind, circuit: circuitName, normalizedState: state.state, statusSource: state.statusSource, inferredLive: state.inferredLive, expectedEnd: state.expectedEnd.toISOString(), staleAfter: new Date(state.expectedEnd.getTime() + 30 * 60_000).toISOString(), lastProviderRefresh: now.toISOString(), timezoneResolved: Boolean(timezone), ...(timezone ? { timezone } : {}), ...(circuitId ? { circuitId } : {}), ...(country ? { country } : {}), ...(location ? { location } : {}) } }]; });
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
