import type { SportsEvent } from "@/core/contracts/Sports";
import type { WeatherData } from "@/engines/environment/models/types";
import type { CosmicAccount } from "@/core/contracts/Account";
import type { CosmicUserPreferences } from "@/core/contracts/Settings";
import { isFavoriteEvent, sportLabels } from "@/services/sports/preferences";
import { resolveSportsTeamIdentity } from "@/services/sports/identity";
import { neutralPreferences } from "@/services/settings/preferences";

const boundedDate = (value: unknown) => typeof value === "string" && !Number.isNaN(Date.parse(value)) ? new Date(value) : undefined;

export function calendarRangeForRequest(query = "", now = new Date(), startInput?: string, endInput?: string) {
  const explicitStart = boundedDate(startInput); const explicitEnd = boundedDate(endInput);
  let start = explicitStart ?? new Date(now); let end = explicitEnd;
  if (!explicitStart && /\btomorrow\b/i.test(query)) { start = new Date(now); start.setDate(start.getDate() + 1); start.setHours(0, 0, 0, 0); end = new Date(start); end.setDate(end.getDate() + 1); }
  else if (!explicitStart && /\btoday\b/i.test(query)) { start = new Date(now); start.setHours(0, 0, 0, 0); end = new Date(start); end.setDate(end.getDate() + 1); }
  else if (!explicitEnd) end = new Date(start.getTime() + (/(next|upcoming|week)/i.test(query) ? 7 : 1) * 24 * 60 * 60 * 1000);
  if (!end || end <= start || end.getTime() - start.getTime() > 14 * 24 * 60 * 60 * 1000) return { valid: false as const, reason: "Calendar date range is invalid or too large." };
  return { valid: true as const, start, end };
}

export function serializeWeatherData(weather: WeatherData, locationLabel?: string) {
  return { available: true, location: { latitude: weather.lat, longitude: weather.lon, ...(locationLabel ? { label: locationLabel.slice(0, 80) } : {}) }, current: { city: weather.city, condition: weather.condition, description: weather.description, temp: weather.temp, feelsLike: weather.feelsLike, precipitation24h: weather.precipitation24h, windSpeed: weather.windSpeed, windDirection: weather.windDirection, lastUpdated: weather.lastUpdated }, alerts: weather.weatherAlerts.slice(0, 5).map((alert) => ({ event: alert.event, severity: alert.severity, headline: alert.headline, expires: alert.expires })) };
}

export function serializeSportsEvent(event: SportsEvent, preferences: typeof neutralPreferences) {
  const identity = (team: SportsEvent["homeTeam"]) => { const resolved = resolveSportsTeamIdentity(event.sport, team); return team ? { name: team.name, abbreviation: team.abbreviation, score: team.score, ...(resolved ? { identity: { canonicalId: resolved.canonicalId, name: resolved.name, abbreviation: resolved.abbreviation } } : {}) } : undefined; };
  return { id: event.id, sport: event.sport, sportLabel: sportLabels[event.sport], title: event.title, start: event.start.toISOString(), ...(event.end ? { end: event.end.toISOString() } : {}), status: event.status, statusDetail: event.statusDetail, venue: event.venue, broadcast: event.broadcast, homeTeam: identity(event.homeTeam), awayTeam: identity(event.awayTeam), favorite: isFavoriteEvent(event, preferences) };
}

export function serializeAccountSettings(account: CosmicAccount, preferences: CosmicUserPreferences, preferencesAvailable: boolean) {
  return { available: true, preferencesAvailable, displayName: account.displayName ?? null, timezone: null, preferredUnits: null, enabledModules: Object.entries(preferences.modules).filter(([, enabled]) => enabled).map(([name]) => name), favoriteTeams: preferences.sports.followedTeams.slice(0, 12).map((team) => ({ sport: team.sport, label: team.label, provider: team.provider })) };
}
