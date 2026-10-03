export interface MlbVenueRecord {
  venueId: string;
  canonicalName: string;
  city: string;
  teams: string[];
  aliases: string[];
  imagePath?: string;
  fallbackImage?: string;
}

/** ID-first registry; add venue imagery without changing event ranking. */
export const MLB_VENUES: MlbVenueRecord[] = [
  { venueId: "1", canonicalName: "Angel Stadium", city: "Anaheim", teams: ["LAA", "108"], aliases: ["angel stadium", "anaheim stadium", "los angeles angels"], fallbackImage: "/dashboard/sports/baseball.webp" },
  { venueId: "3313", canonicalName: "Yankee Stadium", city: "New York", teams: ["NYY", "147"], aliases: ["yankee stadium", "new york yankees"], fallbackImage: "/dashboard/sports/baseball.webp" },
  { venueId: "680", canonicalName: "T-Mobile Park", city: "Seattle", teams: ["SEA", "136"], aliases: ["t mobile park", "seattle mariners"], fallbackImage: "/dashboard/sports/baseball.webp" },
  { venueId: "2392", canonicalName: "Oriole Park at Camden Yards", city: "Baltimore", teams: ["BAL", "110"], aliases: ["camden yards", "oriole park", "baltimore orioles"], fallbackImage: "/dashboard/sports/baseball.webp" },
];

function normalize(value?: string) { return value?.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() ?? ""; }

export function resolveMlbVenue(input: { venueId?: string; homeTeamId?: string; homeTeamAbbreviation?: string; homeTeamName?: string; venue?: string } = {}) {
  const identity = [input.venueId, input.homeTeamId, input.homeTeamAbbreviation].filter(Boolean).map(String);
  const text = normalize(`${input.homeTeamName ?? ""} ${input.venue ?? ""}`);
  return MLB_VENUES.find((venue) => identity.includes(venue.venueId) || venue.teams.some((team) => identity.includes(team)) || venue.aliases.some((alias) => text.includes(normalize(alias))));
}
