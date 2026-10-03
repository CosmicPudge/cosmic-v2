import type { CosmicNotification } from "@/core/contracts/Notifications";
import type { CosmicUserPreferences } from "@/core/contracts/Settings";
import type { SportKind, SportsEvent, SportsSnapshot } from "@/core/contracts/Sports";
import { eventMatchesKioskPreferences, isFavoriteEvent } from "./preferences";

export type SportsSignalType = "GAME_STARTING_SOON" | "RACE_STARTING_SOON" | "QUALIFYING_STARTING_SOON" | "GAME_LIVE" | "CLOSE_GAME" | "FINAL_RESULT" | "EVENT_DELAYED" | "EVENT_POSTPONED" | "QUALIFYING_RESULT" | "RACE_RESULT" | "FAVORITE_DRIVER_RESULT" | "SUMMARY_LIVE" | "SUMMARY_UPCOMING";
export interface SportsPreviousState { status: SportsEvent["status"]; score?: string; }
export type SportsSignalState = Record<string, SportsPreviousState>;

const START_WINDOW_MS = 30 * 60 * 1_000;
const MAX_SIGNAL_SNAPSHOT_AGE_MS = 10 * 60 * 1_000;

function enabled(preferences: CosmicUserPreferences, key: keyof CosmicUserPreferences["sports"]["notifications"], fallback = false) {
  const value = preferences.sports.notifications[key];
  return value === undefined ? fallback : value;
}

function favoriteEntityId(event: SportsEvent, preferences: CosmicUserPreferences) {
  const team = preferences.sports.followedTeams.find((item) => item.sport === event.sport && [event.homeTeam?.id, event.awayTeam?.id].includes(item.teamId));
  if (team) return team.teamId;
  const driver = preferences.sports.followedDrivers.find((item) => item.sport === event.sport || (event.sport === "f1" && item.sport === undefined));
  if (driver) return driver.id;
  const constructor = preferences.sports.followedConstructors.find((item) => event.sport === "f1" && (item.sport === "f1" || item.sport === undefined));
  return constructor?.id;
}

function score(event: SportsEvent) { return event.awayTeam?.score !== undefined && event.homeTeam?.score !== undefined ? `${event.awayTeam.score}-${event.homeTeam.score}` : undefined; }
function clockSeconds(value?: string) { if (!value) return undefined; const parts = value.split(":").map(Number); if (parts.some((part) => !Number.isFinite(part))) return undefined; return parts.length === 2 ? parts[0] * 60 + parts[1] : undefined; }
function isCloseGame(event: SportsEvent) {
  if (event.awayTeam?.score === undefined || event.homeTeam?.score === undefined) return false;
  const difference = Math.abs(event.awayTeam.score - event.homeTeam.score);
  const period = event.metadata?.period;
  const remaining = clockSeconds(event.metadata?.clock);
  if (difference > 8 || period === undefined || remaining === undefined) return false;
  if (event.sport === "mlb") return period >= 7 && difference <= 2;
  if (event.sport === "nfl" || event.sport === "college-football" || event.sport === "nba") return period >= 4 && remaining <= 8 * 60;
  if (event.sport === "mls") return period >= 2 && remaining <= 10 * 60 && difference <= 1;
  return false;
}

function opponent(event: SportsEvent, preferences: CosmicUserPreferences) {
  const favoriteTeam = preferences.sports.followedTeams.find((item) => item.sport === event.sport && ([event.homeTeam?.id, event.awayTeam?.id].includes(item.teamId) || [event.homeTeam?.name, event.awayTeam?.name].some((name) => name?.toLowerCase() === item.label.toLowerCase())));
  if (!favoriteTeam) return event.title;
  const favoriteIsAway = event.awayTeam?.id === favoriteTeam.teamId || event.awayTeam?.name?.toLowerCase() === favoriteTeam.label.toLowerCase();
  const other = favoriteIsAway ? event.homeTeam : event.awayTeam;
  return other?.name ?? event.title;
}

function resultBody(event: SportsEvent, preferences: CosmicUserPreferences) {
  const team = preferences.sports.followedTeams.find((item) => item.sport === event.sport && ([event.homeTeam?.id, event.awayTeam?.id].includes(item.teamId) || [event.homeTeam?.name, event.awayTeam?.name].some((name) => name?.toLowerCase() === item.label.toLowerCase())));
  if (!team || event.awayTeam?.score === undefined || event.homeTeam?.score === undefined) return undefined;
  const favoriteIsAway = event.awayTeam?.id === team.teamId || event.awayTeam?.name?.toLowerCase() === team.label.toLowerCase();
  const favoriteScore = favoriteIsAway ? event.awayTeam.score : event.homeTeam.score;
  const opponentScore = favoriteIsAway ? event.homeTeam.score : event.awayTeam.score;
  const outcome = favoriteScore === opponentScore ? "draw" : favoriteScore > opponentScore ? "win" : "loss";
  return { team, body: `${team.label} ${favoriteScore > opponentScore ? "wins" : favoriteScore < opponentScore ? "loses" : "draws"} ${favoriteScore}-${opponentScore} vs ${opponent(event, preferences)}.`, outcome };
}

function notification(type: SportsSignalType, event: SportsEvent, preferences: CosmicUserPreferences, now: Date, title: string, body: string, importance: CosmicNotification["importance"] = "normal"): CosmicNotification {
  const entity = favoriteEntityId(event, preferences) ?? event.sport;
  return { id: `sports:${type.toLowerCase()}:${event.provider ?? event.source}:${event.id}:${entity}`, source: "sports", title, body, timestamp: now.toISOString(), read: false, importance, category: type, icon: event.sport === "f1" || event.sport === "nascar" ? "sports-race" : "sports", href: `/sports/event/${encodeURIComponent(event.id)}` };
}

export function buildSportsSignals(snapshot: SportsSnapshot, preferences: CosmicUserPreferences, now = new Date(), previous: SportsSignalState = {}, existingIds = new Set<string>()): CosmicNotification[] {
  if (now.getTime() - snapshot.lastUpdated.getTime() > MAX_SIGNAL_SNAPSHOT_AGE_MS) return [];
  const events = [...snapshot.live, ...snapshot.upcoming, ...snapshot.recent];
  const signals: CosmicNotification[] = [];
  const add = (item: CosmicNotification) => { if (!existingIds.has(item.id) && !signals.some((signal) => signal.id === item.id)) signals.push(item); };
  for (const event of events) {
    if (!isFavoriteEvent(event, preferences)) continue;
    const prior = previous[event.id];
    const age = event.start.getTime() - now.getTime();
    const race = event.sport === "f1" || event.sport === "nascar";
    if ((event.status === "scheduled" || event.status === "pregame") && age >= 0 && age <= START_WINDOW_MS && (race ? (event.metadata?.sessionKind === "qualifying" ? enabled(preferences, "qualifyingStartingSoon", true) : enabled(preferences, "raceStartingSoon", true)) : enabled(preferences, "gameStartingSoon", true))) {
      add(notification(race ? (event.metadata?.sessionKind === "qualifying" ? "QUALIFYING_STARTING_SOON" : "RACE_STARTING_SOON") : "GAME_STARTING_SOON", event, preferences, now, "SPORTS · STARTING SOON", `${event.title} starts in ${Math.max(1, Math.ceil(age / 60_000))} min`));
    }
    if (!prior) continue;
    if (prior.status !== "live" && event.status === "live" && enabled(preferences, "gameStarted")) add(notification("GAME_LIVE", event, preferences, now, "SPORTS · LIVE", `${event.title} is live now.`));
    if (prior.status !== "final" && event.status === "final") {
      const result = resultBody(event, preferences);
      if (result && enabled(preferences, "finalResult", true)) add(notification("FINAL_RESULT", event, preferences, now, "SPORTS · FINAL", result.body));
      if (race && event.metadata?.sessionKind === "qualifying" && enabled(preferences, "qualifyingResult", true)) add(notification("QUALIFYING_RESULT", event, preferences, now, "SPORTS · F1", `${event.title} qualifying result is available.`));
      if (race && event.metadata?.sessionKind === "race" && enabled(preferences, event.sport === "nascar" ? "nascarResult" : "raceResult", true)) add(notification("RACE_RESULT", event, preferences, now, event.sport === "nascar" ? "SPORTS · NASCAR" : "SPORTS · F1", `${event.title} result is available.`));
      const driver = preferences.sports.followedDrivers.find((item) => item.sport === event.sport || (event.sport === "f1" && item.sport === undefined));
      if (race && driver && event.metadata?.driverId === driver.id && event.metadata.finishingPosition !== undefined && enabled(preferences, "followedResult", true)) add(notification("FAVORITE_DRIVER_RESULT", event, preferences, now, event.sport === "nascar" ? "SPORTS · NASCAR" : "SPORTS · F1", `${driver.label} finishes P${event.metadata.finishingPosition}${event.metadata.points !== undefined ? ` · ${event.metadata.points} pts` : ""}.`));
    }
    if (prior.status !== event.status && (event.status === "delayed" || event.status === "postponed" || event.status === "cancelled") && enabled(preferences, "delayPostponement", true)) add(notification(event.status === "delayed" ? "EVENT_DELAYED" : "EVENT_POSTPONED", event, preferences, now, "SPORTS · SCHEDULE UPDATE", `${event.title} is ${event.status}.`, event.start.getTime() - now.getTime() < START_WINDOW_MS ? "important" : "normal"));
    if (enabled(preferences, "closeGameLate") && isCloseGame(event) && prior.score !== score(event)) add(notification("CLOSE_GAME", event, preferences, now, "SPORTS · CLOSE GAME", `${event.title} is close late: ${score(event) ?? "score unavailable"}.`, "important"));
  }
  return signals;
}

export function sportsSignalState(snapshot: SportsSnapshot): SportsSignalState {
  return Object.fromEntries([...snapshot.live, ...snapshot.upcoming, ...snapshot.recent].map((event) => [event.id, { status: event.status, ...(score(event) ? { score: score(event) } : {}) }]));
}

function summaryBody(event: SportsEvent, now: Date) {
  if (event.status === "live" || event.status === "delayed") {
    const currentScore = score(event);
    const detail = event.statusDetail ?? event.metadata?.detail ?? "Live now";
    return currentScore ? `${currentScore}${event.metadata?.period ? ` · ${event.metadata.period}${event.sport === "mlb" ? "th" : ""}` : ""}${event.metadata?.clock ? ` · ${event.metadata.clock}` : ""}` : detail;
  }
  const time = event.start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const day = event.start.toDateString() === now.toDateString() ? "Today" : event.start.toLocaleDateString([], { weekday: "short" });
  return `${day} · ${time}${event.venue ? ` · ${event.venue}` : ""}`;
}

/**
 * Passive, bounded notification summaries. Followed sports remain eligible;
 * favorites only influence which items are selected first.
 */
export function buildSportsSummaryNotifications(snapshot: SportsSnapshot, preferences: CosmicUserPreferences, now = new Date()): CosmicNotification[] {
  const candidates = [...snapshot.live, ...snapshot.upcoming]
    .filter((event) => eventMatchesKioskPreferences(event, preferences))
    .filter((event) => event.start.getTime() >= now.getTime() - 6 * 60 * 60_000)
    .sort((left, right) => {
      const leftLive = left.status === "live" || left.status === "delayed";
      const rightLive = right.status === "live" || right.status === "delayed";
      if (leftLive !== rightLive) return Number(rightLive) - Number(leftLive);
      const favoriteDelta = Number(isFavoriteEvent(right, preferences)) - Number(isFavoriteEvent(left, preferences));
      if (favoriteDelta) return favoriteDelta;
      return left.start.getTime() - right.start.getTime();
    });
  const selected: CosmicNotification[] = [];
  const perSport = new Map<SportKind, number>();
  for (const event of candidates) {
    const count = perSport.get(event.sport) ?? 0;
    if (count >= 2 || selected.length >= 8) continue;
    perSport.set(event.sport, count + 1);
    const live = event.status === "live" || event.status === "delayed";
    selected.push(notification(
      live ? "SUMMARY_LIVE" : "SUMMARY_UPCOMING",
      event,
      preferences,
      now,
      `${event.sport.toUpperCase()} · ${live ? "LIVE" : event.start.toDateString() === now.toDateString() ? "TODAY" : "NEXT"}`,
      `${event.title} · ${summaryBody(event, now)}`,
      live ? "important" : "normal",
    ));
  }
  return selected;
}
