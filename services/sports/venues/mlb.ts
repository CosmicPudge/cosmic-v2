export interface MlbVenueRecord {
  venueId: string;
  canonicalName: string;
  slug: string;
  city: string;
  teams: string[];
  aliases: string[];
  imagePath: string;
  fallbackImage?: string;
  status: "current-primary";
}

const FALLBACK_IMAGE = "/dashboard/sports/baseball.webp";
const image = (slug: string) => `/kiosk/scenes/sports/mlb/${slug}.webp`;

/** Current MLB primary home parks. Venue IDs are the first resolution key. */
export const MLB_VENUES: MlbVenueRecord[] = [
  { venueId: "2529", canonicalName: "Sutter Health Park", slug: "sutter-health-park", city: "Sacramento", teams: ["ATH", "OAK", "133"], aliases: ["sutter health park", "athletics", "a's", "oakland athletics", "sacramento athletics"], imagePath: image("sutter-health-park"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "31", canonicalName: "PNC Park", slug: "pnc-park", city: "Pittsburgh", teams: ["PIT", "134"], aliases: ["pnc park", "pittsburgh pirates"], imagePath: image("pnc-park"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "2680", canonicalName: "Petco Park", slug: "petco-park", city: "San Diego", teams: ["SD", "135"], aliases: ["petco park", "san diego padres"], imagePath: image("petco-park"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "680", canonicalName: "T-Mobile Park", slug: "t-mobile-park", city: "Seattle", teams: ["SEA", "136"], aliases: ["t mobile park", "safeco field", "seattle mariners"], imagePath: image("t-mobile-park"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "2395", canonicalName: "Oracle Park", slug: "oracle-park", city: "San Francisco", teams: ["SF", "137"], aliases: ["oracle park", "at&t park", "pac bell park", "san francisco giants"], imagePath: image("oracle-park"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "2889", canonicalName: "Busch Stadium", slug: "busch-stadium", city: "St. Louis", teams: ["STL", "138"], aliases: ["busch stadium", "st louis cardinals"], imagePath: image("busch-stadium"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "12", canonicalName: "Tropicana Field", slug: "tropicana-field", city: "St. Petersburg", teams: ["TB", "139"], aliases: ["tropicana field", "the trop", "tampa bay rays"], imagePath: image("tropicana-field"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "5325", canonicalName: "Globe Life Field", slug: "globe-life-field", city: "Arlington", teams: ["TEX", "140"], aliases: ["globe life field", "texas rangers"], imagePath: image("globe-life-field"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "14", canonicalName: "Rogers Centre", slug: "rogers-centre", city: "Toronto", teams: ["TOR", "141"], aliases: ["rogers centre", "rogers center", "sky dome", "toronto blue jays"], imagePath: image("rogers-centre"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "3312", canonicalName: "Target Field", slug: "target-field", city: "Minneapolis", teams: ["MIN", "142"], aliases: ["target field", "minnesota twins"], imagePath: image("target-field"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "2681", canonicalName: "Citizens Bank Park", slug: "citizens-bank-park", city: "Philadelphia", teams: ["PHI", "143"], aliases: ["citizens bank park", "philadelphia phillies"], imagePath: image("citizens-bank-park"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "4705", canonicalName: "Truist Park", slug: "truist-park", city: "Atlanta", teams: ["ATL", "144"], aliases: ["truist park", "suntrust park", "atlanta braves"], imagePath: image("truist-park"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "4", canonicalName: "Rate Field", slug: "rate-field", city: "Chicago", teams: ["CWS", "145"], aliases: ["rate field", "guaranteed rate field", "u s cellular field", "comiskey park", "chicago white sox"], imagePath: image("rate-field"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "4169", canonicalName: "loanDepot park", slug: "loandepot-park", city: "Miami", teams: ["MIA", "146"], aliases: ["loandepot park", "loan depot park", "marlins park", "miami marlins"], imagePath: image("loandepot-park"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "3313", canonicalName: "Yankee Stadium", slug: "yankee-stadium", city: "Bronx", teams: ["NYY", "147"], aliases: ["yankee stadium", "new york yankees"], imagePath: image("yankee-stadium"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "32", canonicalName: "American Family Field", slug: "american-family-field", city: "Milwaukee", teams: ["MIL", "158"], aliases: ["american family field", "miller park", "milwaukee brewers"], imagePath: image("american-family-field"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "1", canonicalName: "Angel Stadium", slug: "angel-stadium", city: "Anaheim", teams: ["LAA", "108"], aliases: ["angel stadium", "anaheim stadium", "los angeles angels"], imagePath: image("angel-stadium"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "15", canonicalName: "Chase Field", slug: "chase-field", city: "Phoenix", teams: ["AZ", "109", "ARI"], aliases: ["chase field", "bank one ballpark", "arizona diamondbacks"], imagePath: image("chase-field"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "2", canonicalName: "Oriole Park at Camden Yards", slug: "oriole-park-at-camden-yards", city: "Baltimore", teams: ["BAL", "110"], aliases: ["oriole park", "camden yards", "baltimore orioles"], imagePath: image("oriole-park-at-camden-yards"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "3", canonicalName: "Fenway Park", slug: "fenway-park", city: "Boston", teams: ["BOS", "111"], aliases: ["fenway park", "fenway", "boston red sox"], imagePath: image("fenway-park"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "17", canonicalName: "Wrigley Field", slug: "wrigley-field", city: "Chicago", teams: ["CHC", "112"], aliases: ["wrigley field", "chicago cubs"], imagePath: image("wrigley-field"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "2602", canonicalName: "Great American Ball Park", slug: "great-american-ball-park", city: "Cincinnati", teams: ["CIN", "113"], aliases: ["great american ball park", "great american ballpark", "cincinnati reds"], imagePath: image("great-american-ball-park"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "5", canonicalName: "Progressive Field", slug: "progressive-field", city: "Cleveland", teams: ["CLE", "114"], aliases: ["progressive field", "jacobs field", "cleveland guardians", "cleveland indians"], imagePath: image("progressive-field"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "19", canonicalName: "Coors Field", slug: "coors-field", city: "Denver", teams: ["COL", "115"], aliases: ["coors field", "colorado rockies"], imagePath: image("coors-field"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "2394", canonicalName: "Comerica Park", slug: "comerica-park", city: "Detroit", teams: ["DET", "116"], aliases: ["comerica park", "detroit tigers"], imagePath: image("comerica-park"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "2392", canonicalName: "Daikin Park", slug: "daikin-park", city: "Houston", teams: ["HOU", "117"], aliases: ["daikin park", "minute maid park", "enron field", "houston astros"], imagePath: image("daikin-park"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "7", canonicalName: "Kauffman Stadium", slug: "kauffman-stadium", city: "Kansas City", teams: ["KC", "118"], aliases: ["kauffman stadium", "the k", "kansas city royals"], imagePath: image("kauffman-stadium"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "22", canonicalName: "UNIQLO Field at Dodger Stadium", slug: "dodger-stadium", city: "Los Angeles", teams: ["LAD", "119"], aliases: ["dodger stadium", "uniqlo field at dodger stadium", "dodgers stadium", "los angeles dodgers"], imagePath: image("dodger-stadium"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "3309", canonicalName: "Nationals Park", slug: "nationals-park", city: "Washington", teams: ["WSH", "120"], aliases: ["nationals park", "washington nationals"], imagePath: image("nationals-park"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
  { venueId: "3289", canonicalName: "Citi Field", slug: "citi-field", city: "Flushing", teams: ["NYM", "121"], aliases: ["citi field", "she stadium", "new york mets"], imagePath: image("citi-field"), fallbackImage: FALLBACK_IMAGE, status: "current-primary" },
];

function normalize(value?: string) { return value?.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() ?? ""; }

export function resolveMlbVenue(input: { venueId?: string; homeTeamId?: string; homeTeamAbbreviation?: string; homeTeamName?: string; venue?: string } = {}) {
  const byId = input.venueId ? MLB_VENUES.find((venue) => venue.venueId === String(input.venueId)) : undefined;
  if (byId) return byId;
  const venueText = normalize(input.venue);
  if (venueText) return MLB_VENUES.find((venue) => venue.aliases.some((alias) => venueText.includes(normalize(alias)) || normalize(alias).includes(venueText)));
  const identity = [input.homeTeamId, input.homeTeamAbbreviation].filter(Boolean).map(String);
  const homeText = normalize(input.homeTeamName);
  return MLB_VENUES.find((venue) => venue.teams.some((team) => identity.includes(team)) || venue.aliases.some((alias) => homeText.includes(normalize(alias))));
}

export function mlbVenueAssetPath(venue?: MlbVenueRecord) { return venue?.imagePath ?? venue?.fallbackImage ?? FALLBACK_IMAGE; }
