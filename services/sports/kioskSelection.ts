import type { SportsEvent } from "@/core/contracts/Sports";
import { resolveSportsTeamIdentity } from "@/services/sports/identity";
import { resolveF1DisplayState } from "@/services/sports/kioskDisplayState";

export type KioskTrackedSport = "nfl" | "f1" | "nascar" | "mlb";

export interface KioskSportsEvent {
  event: SportsEvent;
  sport: KioskTrackedSport;
  sportLabel: string;
  title: string;
  eventType: string;
  startTime: Date;
  endTime?: Date;
  live: boolean;
  importance: number;
  favoriteWeight: number;
  venueName?: string;
  venueLocation?: string;
  backgroundKey: string;
  homeAware: boolean;
  seriesContext?: string;
  sessionContext?: string;
  providerStatus: SportsEvent["status"];
  displayState: "upcoming" | "live" | "complete";
  inferredLive: boolean;
  broadcaster?: string;
}

export interface KioskSportsSelectionCandidate {
  sport: string;
  title: string;
  eventType?: string;
  session?: string;
  rawStart: string;
  parsedUtcStart?: string;
  parsedLocalStart?: string;
  live: boolean;
  favoriteWeight?: number;
  importance?: number;
  eligible: boolean;
  exclusionReason?: string;
  finalRankingPosition?: number;
}

const SPORT_LABELS: Record<KioskTrackedSport, string> = { nfl: "NFL", f1: "FORMULA 1", nascar: "NASCAR", mlb: "MLB" };
const SESSION_IMPORTANCE: Record<string, number> = { practice1: 10, practice2: 20, practice3: 30, practice: 10, qualifying: 50, sprint: 70, race: 100 };
const F1_CIRCUIT_BACKGROUND_KEYS: Array<{ key: string; aliases: string[] }> = [
  { key: "f1-australia", aliases: ["albert park", "melbourne", "australia", "albert_park"] },
  { key: "f1-china", aliases: ["shanghai", "china"] },
  { key: "f1-japan", aliases: ["suzuka", "japan"] },
  { key: "f1-miami", aliases: ["miami"] },
  { key: "f1-canada", aliases: ["gilles villeneuve", "montreal", "canada", "villeneuve"] },
  { key: "f1-monaco", aliases: ["monaco"] },
  { key: "f1-barcelona", aliases: ["barcelona", "catalunya"] },
  { key: "f1-austria", aliases: ["red bull ring", "spielberg", "austria", "red_bull_ring"] },
  { key: "f1-silverstone", aliases: ["silverstone"] },
  { key: "f1-spa", aliases: ["spa francorchamps", "spa francorchamps", "belgium", "spa"] },
  { key: "f1-hungary", aliases: ["hungaroring", "budapest", "hungary"] },
  { key: "f1-monza", aliases: ["autodromo nazionale monza", "monza"] },
  { key: "f1-madrid", aliases: ["madrid"] },
  { key: "f1-baku", aliases: ["baku", "azerbaijan"] },
  { key: "f1-malaysia", aliases: ["sepang international circuit", "sepang", "malaysia"] },
  { key: "f1-singapore", aliases: ["marina bay street circuit", "marina bay", "singapore", "marina_bay"] },
  { key: "f1-austin", aliases: ["circuit of the americas", "cota", "austin", "americas"] },
  { key: "f1-mexico", aliases: ["autodromo hermanos rodriguez", "hermanos rodriguez", "mexico city", "mexico", "rodriguez"] },
  { key: "f1-brazil", aliases: ["autodromo jose carlos pace", "jose carlos pace", "interlagos", "sao paulo", "brazil"] },
  { key: "f1-las-vegas", aliases: ["las vegas strip circuit", "las vegas", "vegas", "las_vegas"] },
  { key: "f1-qatar", aliases: ["lusail international circuit", "lusail", "qatar", "losail"] },
  { key: "f1-abu-dhabi", aliases: ["yas marina circuit", "yas marina", "abu dhabi", "yas_marina"] },
];
const NASCAR_TRACK_BACKGROUND_KEYS: Array<{ key: string; aliases: string[] }> = [
  { key: "nascar-daytona", aliases: ["daytona"] },
  { key: "nascar-cota", aliases: ["austin", "cota"] },
  { key: "nascar-las-vegas", aliases: ["las vegas motor speedway", "las vegas", "vegas"] },
];
const MLB_STADIUM_BACKGROUND_KEYS: Array<{ key: string; aliases: string[] }> = [
  { key: "mlb-angels", aliases: ["laa", "los angeles angels", "angels", "angel stadium"] },
  { key: "mlb-yankees", aliases: ["nyy", "new york yankees", "yankees", "yankee stadium"] },
];

function normalized(value?: string) { return value?.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() ?? ""; }

function sessionKind(event: SportsEvent): string {
  const explicit = event.metadata?.sessionKind;
  if (explicit) return explicit;
  const text = normalized(`${event.title} ${event.metadata?.sessionType}`);
  if (text.includes("qualifying") || text.includes("shootout")) return "qualifying";
  if (text.includes("sprint")) return "sprint";
  if (text.includes("practice 3") || text.includes("fp3")) return "practice3";
  if (text.includes("practice 2") || text.includes("fp2")) return "practice2";
  if (text.includes("practice 1") || text.includes("fp1")) return "practice1";
  if (text.includes("practice")) return "practice";
  if (event.sport === "f1" || event.sport === "nascar") return "race";
  return "game";
}

function isPostseason(event: SportsEvent) {
  return /postseason|playoff|wild card|wild-card|alds|alcs|nlcs|nl division|world series|game [1-7]/i.test(`${event.title} ${event.metadata?.seasonType} ${event.metadata?.competition}`);
}

function favoriteWeight(event: SportsEvent) {
  const teams = normalized(`${event.homeTeam?.name} ${event.awayTeam?.name} ${event.title}`);
  if (event.sport === "nfl" && /green bay packers|packers/.test(teams)) return 100;
  if (event.sport === "mlb" && /angels|los angeles angels/.test(teams)) return 100;
  if (event.sport === "mlb" && isPostseason(event)) return 70;
  return 0;
}

function eventType(event: SportsEvent, session: string) {
  if (event.sport === "f1" || event.sport === "nascar") return session === "race" ? "RACE" : session.toUpperCase();
  return isPostseason(event) ? "POSTSEASON" : "GAME";
}

function matchBackgroundKey(text: string, mappings: Array<{ key: string; aliases: string[] }>) {
  return mappings.find(({ aliases }) => aliases.some((alias) => text.includes(alias)))?.key;
}

function compareKioskSportsEvents(left: KioskSportsEvent, right: KioskSportsEvent) {
  if (left.live !== right.live) return left.live ? -1 : 1;
  if (left.live && right.live && left.importance !== right.importance) return right.importance - left.importance;
  const timeDelta = left.startTime.getTime() - right.startTime.getTime();
  if (timeDelta) return timeDelta;
  if (left.favoriteWeight !== right.favoriteWeight) return right.favoriteWeight - left.favoriteWeight;
  return right.importance - left.importance || left.sport.localeCompare(right.sport);
}

function backgroundKey(event: SportsEvent): string {
  const venue = normalized(`${event.venue} ${event.metadata?.circuit} ${event.metadata?.track} ${event.metadata?.country} ${event.metadata?.location}`);
  if (event.sport === "nfl") return `nfl-${(resolveSportsTeamIdentity("nfl", event.homeTeam)?.abbreviation ?? event.homeTeam?.abbreviation ?? event.homeTeam?.id ?? "generic").toLowerCase()}`;
  if (event.sport === "f1") {
    return matchBackgroundKey(venue, F1_CIRCUIT_BACKGROUND_KEYS) ?? "f1-generic";
  }
  if (event.sport === "nascar") {
    return matchBackgroundKey(venue, NASCAR_TRACK_BACKGROUND_KEYS) ?? "nascar-generic";
  }
  const homeTeam = normalized(`${event.homeTeam?.id} ${event.homeTeam?.abbreviation} ${event.homeTeam?.name}`);
  const homeVenue = normalized(`${event.venue} ${event.metadata?.location}`);
  return matchBackgroundKey(`${homeTeam} ${homeVenue}`, MLB_STADIUM_BACKGROUND_KEYS) ?? "mlb-generic";
}

export function normalizeKioskSportsEvent(event: SportsEvent, now = new Date()): KioskSportsEvent | undefined {
  if (!["nfl", "f1", "nascar", "mlb"].includes(event.sport)) return undefined;
  if (["final", "cancelled", "postponed"].includes(event.status)) return undefined;
  const sport = event.sport as KioskTrackedSport;
  const session = sessionKind(event);
  const f1Display = sport === "f1" ? resolveF1DisplayState(event, now) : undefined;
  const live = f1Display ? f1Display.displayState === "live" : event.status === "live" || event.status === "delayed";
  const importance = sport === "f1" || sport === "nascar" ? SESSION_IMPORTANCE[session] ?? 0 : sport === "mlb" && isPostseason(event) ? 90 : 50;
  const location = event.metadata?.location;
  return { event, sport, sportLabel: SPORT_LABELS[sport], title: event.title, eventType: eventType(event, session), startTime: event.start, ...(event.end ? { endTime: event.end } : {}), live, importance, favoriteWeight: favoriteWeight(event), ...(event.venue ? { venueName: event.venue } : {}), ...(location ? { venueLocation: location } : {}), backgroundKey: backgroundKey(event), homeAware: sport === "nfl" || sport === "mlb", ...(isPostseason(event) ? { seriesContext: event.metadata?.competition ?? "Postseason" } : {}), ...(sport === "f1" || sport === "nascar" ? { sessionContext: session } : {}), providerStatus: event.status, displayState: f1Display?.displayState ?? (live ? "live" : event.status === "final" ? "complete" : "upcoming"), inferredLive: f1Display?.inferredLive ?? false, ...(sport === "f1" ? { broadcaster: "Apple TV" } : event.broadcast ? { broadcaster: event.broadcast } : {}) };
}

export function selectKioskSportsEvent(events: SportsEvent[], now = new Date()): KioskSportsEvent | undefined {
  const candidates = [...new Map(events.map((event) => [event.id, event])).values()].flatMap((event) => {
    const normalizedEvent = normalizeKioskSportsEvent(event, now);
    return normalizedEvent && (normalizedEvent.live || normalizedEvent.startTime.getTime() >= now.getTime()) ? [normalizedEvent] : [];
  });
  return candidates.sort(compareKioskSportsEvents)[0];
}

export function describeKioskSportsSelection(events: SportsEvent[], now = new Date(), localTimeZone = "UTC") {
  const uniqueEvents = [...new Map(events.map((event) => [event.id, event])).values()];
  const rows: Array<{ event: SportsEvent; normalized?: KioskSportsEvent; candidate: KioskSportsSelectionCandidate }> = uniqueEvents.map((event) => {
    const rawStart = event.start instanceof Date ? event.start.toISOString() : String(event.start);
    const normalizedEvent = normalizeKioskSportsEvent(event, now);
    let exclusionReason: string | undefined;
    if (!normalizedEvent) exclusionReason = !["nfl", "f1", "nascar", "mlb"].includes(event.sport) ? "unsupported-sport-or-terminal-status" : "invalid-event";
    else if (!Number.isFinite(normalizedEvent.startTime.getTime())) exclusionReason = "invalid-start";
    else if (!normalizedEvent.live && normalizedEvent.startTime.getTime() < now.getTime()) exclusionReason = "start-before-now";
    const candidate: KioskSportsSelectionCandidate = {
      sport: event.sport,
      title: event.title,
      eventType: normalizedEvent?.eventType,
      session: normalizedEvent?.sessionContext,
      rawStart,
      ...(normalizedEvent ? { parsedUtcStart: normalizedEvent.startTime.toISOString(), parsedLocalStart: normalizedEvent.startTime.toLocaleString("en-US", { timeZone: localTimeZone, timeZoneName: "short" }) } : {}),
      live: normalizedEvent?.live ?? false,
      favoriteWeight: normalizedEvent?.favoriteWeight,
      importance: normalizedEvent?.importance,
      eligible: !exclusionReason,
      ...(exclusionReason ? { exclusionReason } : {}),
    };
    return { event, normalized: normalizedEvent, candidate };
  });
  const ranked = rows.filter((row): row is typeof row & { normalized: KioskSportsEvent } => Boolean(row.normalized && row.candidate.eligible)).sort((left, right) => compareKioskSportsEvents(left.normalized, right.normalized));
  ranked.forEach((row, index) => { row.candidate.finalRankingPosition = index + 1; });
  const selected = ranked[0]?.normalized;
  return {
    currentServerTime: now.toISOString(),
    timezoneUsed: localTimeZone,
    candidates: rows.map((row) => row.candidate),
    selectedEvent: selected ? { sport: selected.sport, title: selected.title, eventType: selected.eventType, start: selected.startTime.toISOString() } : null,
    whyWon: selected ? "earliest eligible upcoming event after live/importance handling" : "no eligible event",
  };
}
