import type { SportsEvent } from "@/core/contracts/Sports";
import { resolveSportsTeamIdentity } from "@/services/sports/identity";

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
}

const SPORT_LABELS: Record<KioskTrackedSport, string> = { nfl: "NFL", f1: "FORMULA 1", nascar: "NASCAR", mlb: "MLB" };
const SESSION_IMPORTANCE: Record<string, number> = { practice1: 10, practice2: 20, practice3: 30, practice: 10, qualifying: 50, sprint: 70, race: 100 };

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

function backgroundKey(event: SportsEvent): string {
  const venue = normalized(`${event.venue} ${event.metadata?.circuit} ${event.metadata?.track} ${event.metadata?.country} ${event.metadata?.location}`);
  if (event.sport === "nfl") return `nfl-${(resolveSportsTeamIdentity("nfl", event.homeTeam)?.abbreviation ?? event.homeTeam?.abbreviation ?? event.homeTeam?.id ?? "generic").toLowerCase()}`;
  if (event.sport === "f1") {
    if (/monza|italy/.test(venue)) return "f1-monza";
    if (/austin|cota|united states/.test(venue)) return "f1-austin";
    if (/marina bay|singapore/.test(venue)) return "f1-marina-bay";
    if (/malaysia|sepang/.test(venue)) return "f1-malaysia";
    return "f1-generic";
  }
  if (event.sport === "nascar") {
    if (/daytona/.test(venue)) return "nascar-daytona";
    if (/austin|cota/.test(venue)) return "nascar-cota";
    return "nascar-generic";
  }
  const teams = normalized(`${event.homeTeam?.name} ${event.awayTeam?.name} ${event.title}`);
  if (/angels|los angeles angels/.test(teams)) return "mlb-angels";
  if (/yankees|new york yankees/.test(teams)) return "mlb-yankees";
  return "mlb-generic";
}

export function normalizeKioskSportsEvent(event: SportsEvent): KioskSportsEvent | undefined {
  if (!["nfl", "f1", "nascar", "mlb"].includes(event.sport)) return undefined;
  if (["final", "cancelled", "postponed"].includes(event.status)) return undefined;
  const sport = event.sport as KioskTrackedSport;
  const session = sessionKind(event);
  const live = event.status === "live" || event.status === "delayed";
  const importance = sport === "f1" || sport === "nascar" ? SESSION_IMPORTANCE[session] ?? 0 : sport === "mlb" && isPostseason(event) ? 90 : 50;
  const location = event.metadata?.location;
  return { event, sport, sportLabel: SPORT_LABELS[sport], title: event.title, eventType: eventType(event, session), startTime: event.start, ...(event.end ? { endTime: event.end } : {}), live, importance, favoriteWeight: favoriteWeight(event), ...(event.venue ? { venueName: event.venue } : {}), ...(location ? { venueLocation: location } : {}), backgroundKey: backgroundKey(event), homeAware: sport === "nfl" || sport === "mlb", ...(isPostseason(event) ? { seriesContext: event.metadata?.competition ?? "Postseason" } : {}), ...(sport === "f1" || sport === "nascar" ? { sessionContext: session } : {}) };
}

export function selectKioskSportsEvent(events: SportsEvent[], now = new Date()): KioskSportsEvent | undefined {
  const candidates = [...new Map(events.map((event) => [event.id, event])).values()].flatMap((event) => {
    const normalizedEvent = normalizeKioskSportsEvent(event);
    return normalizedEvent && (normalizedEvent.live || normalizedEvent.startTime.getTime() >= now.getTime()) ? [normalizedEvent] : [];
  });
  return candidates.sort((left, right) => {
    if (left.live !== right.live) return left.live ? -1 : 1;
    if (left.live && right.live && left.importance !== right.importance) return right.importance - left.importance;
    if (left.favoriteWeight !== right.favoriteWeight) return right.favoriteWeight - left.favoriteWeight;
    const timeDelta = left.startTime.getTime() - right.startTime.getTime();
    return timeDelta || right.importance - left.importance || left.sport.localeCompare(right.sport);
  })[0];
}
