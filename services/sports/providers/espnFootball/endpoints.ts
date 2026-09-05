export type EspnFootballLeague = "nfl" | "college-football";

const SITE_BASE = "https://site.api.espn.com/apis/site/v2/sports/football";
const CORE_BASE = "https://sports.core.api.espn.com/v2/sports/football/leagues";

export function espnFootballLeaguePath(league: EspnFootballLeague) { return league === "nfl" ? "nfl" : "college-football"; }
export function espnFootballTeamsUrl(league: EspnFootballLeague, limit = 900) { return `${SITE_BASE}/${espnFootballLeaguePath(league)}/teams?limit=${limit}`; }
export function espnFootballTeamScheduleUrl(league: EspnFootballLeague, teamId: string, season: number) { return `${SITE_BASE}/${espnFootballLeaguePath(league)}/teams/${encodeURIComponent(teamId)}/schedule?dates=${season}`; }
export function espnFootballScoreboardUrl(league: EspnFootballLeague, dates?: string) { return `${SITE_BASE}/${espnFootballLeaguePath(league)}/scoreboard${dates ? `?dates=${encodeURIComponent(dates)}` : ""}`; }
export function espnFootballSummaryUrl(league: EspnFootballLeague, eventId: string) { return `${SITE_BASE}/${espnFootballLeaguePath(league)}/summary?event=${encodeURIComponent(eventId)}`; }
export function espnFootballStandingsUrl(league: EspnFootballLeague, season: number) { return `https://site.api.espn.com/apis/v2/sports/football/${espnFootballLeaguePath(league)}/standings?season=${season}`; }
export function espnFootballRankingsUrl(season: number) { return `${SITE_BASE}/college-football/rankings?season=${season}`; }
export function espnFootballCoreEventUrl(league: EspnFootballLeague, eventId: string, resource: "plays" | "drives", limit = 500) { return `${CORE_BASE}/${espnFootballLeaguePath(league)}/events/${encodeURIComponent(eventId)}/competitions/${encodeURIComponent(eventId)}/${resource}?limit=${limit}`; }
export function espnFootballProbabilityUrl(eventId: string) { return `${CORE_BASE}/nfl/events/${encodeURIComponent(eventId)}/competitions/${encodeURIComponent(eventId)}/probabilities?limit=500`; }
