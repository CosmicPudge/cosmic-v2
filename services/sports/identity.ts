import type { SportKind, SportsTeam } from "@/core/contracts/Sports";
import { CFB_TEAM_IDENTITY } from "@/services/sports/identity/generated/cfbTeams";

export interface SportsTeamIdentity {
  canonicalId: string;
  name: string;
  shortName: string;
  schoolName?: string;
  abbreviation: string;
  conference?: string;
  division?: string;
  logoPath?: string;
  accent?: string;
}

type RegistryEntry = SportsTeamIdentity & { aliases?: string[]; legacyIds?: string[] };
const NFL_COLORS: Record<string, string> = { ARI: "#97233f", ATL: "#a71930", BAL: "#241773", BUF: "#00338d", CAR: "#0085ca", CHI: "#c83803", CIN: "#fb4f14", CLE: "#ff3c00", DAL: "#041e42", DEN: "#fb4f14", DET: "#0076b6", GB: "#203731", HOU: "#03202f", IND: "#002c5f", JAX: "#006778", KC: "#e31837", LV: "#a5acaf", LAC: "#0080c6", LAR: "#ffa300", MIA: "#008e97", MIN: "#4f2683", NE: "#c8102e", NO: "#d3bc8d", NYG: "#0b2265", NYJ: "#125740", PHI: "#a5acaf", PIT: "#ffb612", SF: "#aa0000", SEA: "#69be28", TB: "#d50a0a", TEN: "#4b92db", WSH: "#ffb612" };

const nfl = (canonicalId: string, name: string, abbreviation: string, conference: string, division: string, aliases: string[] = []): RegistryEntry => ({
  canonicalId, name, shortName: name.replace(/^(Arizona|Atlanta|Baltimore|Buffalo|Carolina|Chicago|Cincinnati|Cleveland|Dallas|Denver|Detroit|Green Bay|Houston|Indianapolis|Jacksonville|Kansas City|Las Vegas|Los Angeles|Miami|Minnesota|New England|New Orleans|New York|Philadelphia|Pittsburgh|San Francisco|Seattle|Tampa Bay|Tennessee|Washington)\s+/, ""), abbreviation, conference, division, aliases, accent: NFL_COLORS[abbreviation], logoPath: `/sports/nfl/logos/${abbreviation.toLowerCase()}.png`,
});

export const NFL_TEAM_REGISTRY: RegistryEntry[] = [
  nfl("ari", "Arizona Cardinals", "ARI", "NFC", "NFC West"), nfl("atl", "Atlanta Falcons", "ATL", "NFC", "NFC South"), nfl("bal", "Baltimore Ravens", "BAL", "AFC", "AFC North"), nfl("buf", "Buffalo Bills", "BUF", "AFC", "AFC East"),
  nfl("car", "Carolina Panthers", "CAR", "NFC", "NFC South"), nfl("chi", "Chicago Bears", "CHI", "NFC", "NFC North"), nfl("cin", "Cincinnati Bengals", "CIN", "AFC", "AFC North"), nfl("cle", "Cleveland Browns", "CLE", "AFC", "AFC North"),
  nfl("dal", "Dallas Cowboys", "DAL", "NFC", "NFC East"), nfl("den", "Denver Broncos", "DEN", "AFC", "AFC West"), nfl("det", "Detroit Lions", "DET", "NFC", "NFC North"), nfl("gb", "Green Bay Packers", "GB", "NFC", "NFC North", ["green bay"]),
  nfl("hou", "Houston Texans", "HOU", "AFC", "AFC South"), nfl("ind", "Indianapolis Colts", "IND", "AFC", "AFC South"), nfl("jax", "Jacksonville Jaguars", "JAX", "AFC", "AFC South"), nfl("kc", "Kansas City Chiefs", "KC", "AFC", "AFC West"),
  nfl("lv", "Las Vegas Raiders", "LV", "AFC", "AFC West"), nfl("lac", "Los Angeles Chargers", "LAC", "AFC", "AFC West"), nfl("lar", "Los Angeles Rams", "LAR", "NFC", "NFC West"), nfl("mia", "Miami Dolphins", "MIA", "AFC", "AFC East"),
  nfl("min", "Minnesota Vikings", "MIN", "NFC", "NFC North"), nfl("ne", "New England Patriots", "NE", "AFC", "AFC East"), nfl("no", "New Orleans Saints", "NO", "NFC", "NFC South"), nfl("nyg", "New York Giants", "NYG", "NFC", "NFC East"),
  nfl("nyj", "New York Jets", "NYJ", "AFC", "AFC East"), nfl("phi", "Philadelphia Eagles", "PHI", "NFC", "NFC East"), nfl("pit", "Pittsburgh Steelers", "PIT", "AFC", "AFC North"), nfl("sf", "San Francisco 49ers", "SF", "NFC", "NFC West"),
  nfl("sea", "Seattle Seahawks", "SEA", "NFC", "NFC West"), nfl("tb", "Tampa Bay Buccaneers", "TB", "NFC", "NFC South"), nfl("ten", "Tennessee Titans", "TEN", "AFC", "AFC South"), nfl("wsh", "Washington Commanders", "WSH", "NFC", "NFC East", ["washington", "was"]),
];

const MLB_IDS: Record<string, string> = { "108": "LAA", "134": "PIT" };

export function resolveSportsTeamIdentity(sport: SportKind, team?: SportsTeam): SportsTeamIdentity | undefined {
  if (!team) return undefined;
  const normalized = team.name.trim().toLowerCase();
  if (sport === "college-football") {
    if (team.logo?.startsWith("https://a.espncdn.com/")) return { canonicalId: team.id ?? normalized, name: team.name, shortName: team.name, abbreviation: team.abbreviation ?? initialsForTeam(team), logoPath: team.logo };
    const catalog = CFB_TEAM_IDENTITY[team.id ?? ""];
    if (catalog) return { canonicalId: team.id === "254" ? "utah" : team.id ?? catalog.providerTeamId, name: catalog.displayName, shortName: catalog.shortDisplayName ?? catalog.displayName, schoolName: catalog.school, abbreviation: catalog.abbreviation ?? team.abbreviation ?? initialsForTeam(team), logoPath: catalog.logoPath ?? catalog.logoUrl, accent: catalog.color ? `#${catalog.color.replace(/^#/, "")}` : undefined };
  }
  if (team.logo && /^https:\/\/(?:a\.espncdn\.com|site\.api\.espn\.com)\//.test(team.logo)) {
    return { canonicalId: team.id ?? normalized, name: team.name, shortName: team.name, abbreviation: team.abbreviation ?? initialsForTeam(team), logoPath: team.logo };
  }
  if (sport === "nfl") {
    return NFL_TEAM_REGISTRY.find((entry) => entry.canonicalId === team.id || entry.legacyIds?.includes(team.id ?? "") || entry.abbreviation.toLowerCase() === team.abbreviation?.toLowerCase() || entry.name.toLowerCase() === normalized || entry.aliases?.some((alias) => alias === normalized));
  }
  if (sport === "mlb") {
    const abbreviation = MLB_IDS[team.id ?? ""] ?? team.abbreviation?.toUpperCase();
    if (!abbreviation) return undefined;
    const accent = abbreviation === "LAA" ? "#ba0021" : abbreviation === "PIT" ? "#ffb81c" : undefined;
    return { canonicalId: team.id ?? abbreviation.toLowerCase(), name: team.name, shortName: team.name, abbreviation, logoPath: `/logos/mlb/${abbreviation}.svg`, ...(accent ? { accent } : {}) };
  }
  if (sport === "college-football" && (team.id === "254" || normalized === "utah utes" || team.abbreviation?.toUpperCase() === "UTAH")) {
    return { canonicalId: "utah", name: "Utah Utes", shortName: "Utes", abbreviation: "UTAH", logoPath: "/sports/cfb/logos/utah.png", accent: "#cc0000" };
  }
  return undefined;
}

export function initialsForTeam(team?: SportsTeam): string {
  if (!team) return "?";
  return team.abbreviation?.slice(0, 3).toUpperCase() ?? team.name.split(/\s+/).map((word) => word[0]).join("").slice(0, 3).toUpperCase();
}

export function isRaceSport(sport: SportKind): boolean {
  return sport === "f1" || sport === "nascar";
}
