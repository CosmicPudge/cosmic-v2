import type { SportsDirectoryEntry } from "@/services/sports/directory";
import { fetchJson, isRecord, records, string } from "./types";
import { espnFootballTeamsUrl } from "./espnFootball/endpoints";

const DIRECTORY_URL = espnFootballTeamsUrl("college-football", 900);
const ALLOWED_LOGO_HOST = "a.espncdn.com";

function safeLogoUrl(value: unknown): string | undefined {
  const candidate = string(value);
  if (!candidate) return undefined;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" && url.hostname === ALLOWED_LOGO_HOST ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function subdivision(value: unknown): "FBS" | "FCS" | undefined {
  const normalized = string(value)?.toUpperCase();
  return normalized === "FBS" || normalized === "FCS" ? normalized : undefined;
}

function normalizeTeam(value: Record<string, unknown>): SportsDirectoryEntry | undefined {
  const team = isRecord(value.team) ? value.team : value;
  const id = string(team.id);
  const name = string(team.displayName) ?? string(team.name);
  if (!id || !name) return undefined;
  if (team.isActive === false || team.isAllStar === true) return undefined;
  const abbreviation = string(team.abbreviation);
  const nickname = string(team.name) && string(team.name) !== name ? string(team.name) : undefined;
  const school = string(team.location) ?? (nickname ? name.replace(new RegExp(`\\s+${nickname.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}$`), "") : undefined);
  const conferenceRecord = isRecord(team.conference) ? team.conference : undefined;
  const conference = string(conferenceRecord?.name) ?? string(team.conference);
  const conferenceId = string(conferenceRecord?.id);
  const logos = records(team.logos);
  const logo = logos.find((item) => string(item.href)?.includes("/500/")) ?? logos[0];
  const logoUrl = safeLogoUrl(logo?.href);
  const darkLogoUrl = safeLogoUrl(logos.find((item) => string(item.rel)?.toLowerCase().includes("dark"))?.href);
  const alternateColor = string(team.alternateColor);
  const color = string(team.color);
  const uid = string(team.uid);
  const slug = string(team.slug);
  const subdivisionValue = subdivision(team.subdivision) ?? subdivision(team.classification) ?? subdivision(team.groups);
  return {
    id: `college-football-${id}`,
    sport: "college-football",
    entityType: "team",
    name,
    ...(school ? { school } : {}),
    ...(slug ? { slug } : {}),
    ...(uid ? { uid } : {}),
    active: team.isActive !== false,
    ...(team.isAllStar !== undefined ? { isAllStar: team.isAllStar === true } : {}),
    ...(nickname ? { nickname, shortName: nickname } : {}),
    ...(abbreviation ? { abbreviation } : {}),
    provider: "espn",
    providerId: id,
    ...(conference ? { conference } : {}),
    ...(conference ? { conferenceName: conference } : {}),
    ...(conferenceId ? { conferenceId } : {}),
    ...(subdivisionValue ? { subdivision: subdivisionValue } : {}),
    ...(logoUrl ? { logoUrl } : {}),
    ...(darkLogoUrl ? { darkLogoUrl } : {}),
    ...(color ? { color } : {}),
    ...(alternateColor ? { alternateColor } : {}),
  };
}

function collectTeams(value: unknown): Record<string, unknown>[] {
  if (!isRecord(value)) return [];
  const direct = records(value.teams);
  const sports = records(value.sports);
  const leagues = sports.flatMap((sport) => records(sport.leagues));
  const leagueTeams = leagues.flatMap((league) => records(league.teams));
  return [...direct, ...leagueTeams];
}

export function normalizeCollegeFootballDirectoryPayload(payload: unknown): SportsDirectoryEntry[] {
  const entries = collectTeams(payload).map(normalizeTeam).filter((entry): entry is SportsDirectoryEntry => Boolean(entry));
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (!entry.providerId || seen.has(entry.providerId)) return false;
    seen.add(entry.providerId);
    return true;
  }).sort((left, right) => left.name.localeCompare(right.name));
}

export async function getCollegeFootballDirectory(): Promise<SportsDirectoryEntry[]> {
  return normalizeCollegeFootballDirectoryPayload(await fetchJson(DIRECTORY_URL, 86_400));
}

export const collegeFootballDirectoryUrl = DIRECTORY_URL;
