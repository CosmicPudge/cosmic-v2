import type { SportKind, SportsTeam } from "@/core/contracts/Sports";

export interface FootballVenue {
  id: string;
  providerVenueId?: string;
  canonicalName: string;
  city?: string;
  state?: string;
  country?: string;
  teamIds?: string[];
  schoolIds?: string[];
  aliases: string[];
  imagePath?: string;
  fallbackImagePath?: string;
  objectPosition?: string;
  focalPoint?: { x: number; y: number };
  neutralSite?: boolean;
  bowlSite?: boolean;
  playoffSite?: boolean;
  attribution?: string;
  assetStatus: "complete" | "missing";
}

const CFB_IMAGE_ROOT = "/kiosk/scenes/sports/cfb";
const CFB_FALLBACK = "/dashboard/sports/stadium.webp";
const cfb = (venue: Omit<FootballVenue, "fallbackImagePath" | "assetStatus"> & { slug: string; image?: boolean }): FootballVenue => ({
  ...venue,
  ...(venue.image ? { imagePath: `${CFB_IMAGE_ROOT}/${venue.slug}.webp` } : {}),
  fallbackImagePath: CFB_FALLBACK,
  assetStatus: venue.image ? "complete" : "missing",
});

/** Shared football venue registry. Add aliases here instead of renderer-specific matching. */
export const FOOTBALL_VENUES: FootballVenue[] = [
  cfb({ id: "cfb-maverik-stadium", slug: "maverik-stadium", canonicalName: "Maverik Stadium", city: "Logan", state: "UT", schoolIds: ["328"], aliases: ["maverik stadium", "utah state stadium", "romney stadium"], image: false }),
  cfb({ id: "cfb-albertsons-stadium", slug: "albertsons-stadium", canonicalName: "Albertsons Stadium", city: "Boise", state: "ID", schoolIds: ["68"], aliases: ["albertsons stadium", "boise state stadium", "bronco stadium", "boise state"], image: false }),
  cfb({ id: "cfb-rose-bowl", slug: "rose-bowl", canonicalName: "Rose Bowl", city: "Pasadena", state: "CA", aliases: ["rose bowl stadium", "rose bowl game"], neutralSite: true, bowlSite: true, image: false }),
  cfb({ id: "cfb-mercedes-benz-stadium", slug: "mercedes-benz-stadium", canonicalName: "Mercedes-Benz Stadium", city: "Atlanta", state: "GA", aliases: ["mercedes benz stadium", "atlanta neutral site"], neutralSite: true, bowlSite: true, image: false }),
  cfb({ id: "cfb-lumen-field", slug: "lumen-field", canonicalName: "Lumen Field", city: "Seattle", state: "WA", aliases: ["lumen field", "centurylink field"], neutralSite: true, image: false }),
];

function normalize(value?: string) { return value?.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() ?? ""; }
function exact(value: string | undefined, candidates: string[]) { const normalized = normalize(value); return normalized ? candidates.some((candidate) => normalize(candidate) === normalized) : false; }

export interface FootballVenueInput {
  sport?: Extract<SportKind, "nfl" | "college-football">;
  providerVenueId?: string;
  venue?: string;
  homeTeam?: SportsTeam;
  neutralSite?: boolean;
}

export function resolveFootballVenue(input: FootballVenueInput = {}) {
  if (input.providerVenueId) {
    const byProviderId = FOOTBALL_VENUES.find((venue) => venue.providerVenueId === String(input.providerVenueId));
    if (byProviderId) return byProviderId;
  }
  const venueText = normalize(input.venue);
  if (venueText) {
    const byName = FOOTBALL_VENUES.find((venue) => normalize(venue.canonicalName) === venueText || venue.aliases.some((alias) => exact(input.venue, [alias])));
    if (byName) return byName;
  }
  if (input.neutralSite) return undefined;
  const homeId = input.homeTeam?.id;
  const homeName = normalize(input.homeTeam?.name);
  return FOOTBALL_VENUES.find((venue) => venue.schoolIds?.includes(String(homeId)) || venue.aliases.some((alias) => homeName.includes(normalize(alias))));
}

export function footballVenueAssetPath(venue?: FootballVenue) { return venue?.assetStatus === "complete" ? venue.imagePath : venue?.fallbackImagePath ?? CFB_FALLBACK; }
