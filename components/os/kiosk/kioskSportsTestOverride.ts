import type { SportsEvent, SportsTeam } from "@/core/contracts/Sports";

export type KioskTestSport = "nfl" | "mlb" | "f1" | "nascar";
export type KioskTestSession = "practice1" | "practice2" | "practice3" | "qualifying" | "sprint" | "race";

export interface KioskSportsTestOverride {
  sport: KioskTestSport;
  venue?: string;
  session?: KioskTestSession;
  away?: string;
  home?: string;
}

const SPORTS = new Set<KioskTestSport>(["nfl", "mlb", "f1", "nascar"]);
const SESSIONS = new Set<KioskTestSession>(["practice1", "practice2", "practice3", "qualifying", "sprint", "race"]);
const DEV_HOSTS = new Set(["dev.cosmicpudge.shop", "localhost", "127.0.0.1"]);

const NFL_TEAMS: Record<string, SportsTeam> = {
  gb: { name: "Green Bay Packers", abbreviation: "GB" },
  tb: { name: "Tampa Bay Buccaneers", abbreviation: "TB" },
  det: { name: "Detroit Lions", abbreviation: "DET" },
  dal: { name: "Dallas Cowboys", abbreviation: "DAL" },
};

const MLB_TEAMS: Record<string, SportsTeam> = {
  laa: { name: "Los Angeles Angels", abbreviation: "LAA" },
  nyy: { name: "New York Yankees", abbreviation: "NYY" },
  bos: { name: "Boston Red Sox", abbreviation: "BOS" },
};

const VENUES: Record<KioskTestSport, Record<string, { label: string; team?: SportsTeam; country?: string; track?: string }>> = {
  nfl: {
    gb: { label: "Lambeau Field", team: NFL_TEAMS.gb },
    tb: { label: "Raymond James Stadium", team: NFL_TEAMS.tb },
    det: { label: "Ford Field", team: NFL_TEAMS.det },
    dal: { label: "AT&T Stadium", team: NFL_TEAMS.dal },
  },
  mlb: {
    laa: { label: "Angel Stadium", team: MLB_TEAMS.laa },
    nyy: { label: "Yankee Stadium", team: MLB_TEAMS.nyy },
  },
  f1: {
    malaysia: { label: "Sepang International Circuit", country: "Malaysia", track: "Sepang International Circuit" },
    monza: { label: "Autodromo Nazionale Monza", country: "Italy", track: "Monza" },
    austin: { label: "Circuit of the Americas", country: "United States", track: "COTA" },
    singapore: { label: "Marina Bay Street Circuit", country: "Singapore", track: "Marina Bay" },
  },
  nascar: {
    "las-vegas": { label: "Las Vegas Motor Speedway", track: "Las Vegas Motor Speedway" },
    daytona: { label: "Daytona International Speedway", track: "Daytona" },
    cota: { label: "Circuit of the Americas", track: "COTA" },
  },
};

function cleanCode(value: string | null) {
  const code = value?.trim().toLowerCase() ?? "";
  return /^[a-z0-9-]{1,24}$/.test(code) ? code : undefined;
}

function sessionLabel(session: KioskTestSession) {
  return session === "practice1" ? "Practice 1" : session === "practice2" ? "Practice 2" : session === "practice3" ? "Practice 3" : session === "qualifying" ? "Qualifying" : session[0].toUpperCase() + session.slice(1);
}

export function isKioskSportsTestHost(hostname: string, pathname: string) {
  return pathname === "/kiosk" && DEV_HOSTS.has(hostname.split(":")[0].toLowerCase());
}

export function parseKioskSportsTestOverride(params: URLSearchParams, hostname: string, pathname: string): KioskSportsTestOverride | null {
  if (!isKioskSportsTestHost(hostname, pathname)) return null;
  const sport = params.get("sport")?.trim().toLowerCase() as KioskTestSport | undefined;
  if (!sport || !SPORTS.has(sport)) return null;
  const venue = cleanCode(params.get("venue"));
  const session = cleanCode(params.get("session")) as KioskTestSession | undefined;
  return {
    sport,
    ...(venue && VENUES[sport][venue] ? { venue } : {}),
    ...(session && SESSIONS.has(session) ? { session } : {}),
    ...(cleanCode(params.get("away")) ? { away: cleanCode(params.get("away")) } : {}),
    ...(cleanCode(params.get("home")) ? { home: cleanCode(params.get("home")) } : {}),
  };
}

export function createKioskSportsTestEvent(override: KioskSportsTestOverride, now = new Date()): SportsEvent {
  const venue = override.venue ? VENUES[override.sport][override.venue] : undefined;
  const home = override.sport === "nfl" ? NFL_TEAMS[override.home ?? override.venue ?? "gb"] ?? NFL_TEAMS.gb : override.sport === "mlb" ? MLB_TEAMS[override.home ?? override.venue ?? "laa"] ?? MLB_TEAMS.laa : undefined;
  const away = override.sport === "nfl" ? NFL_TEAMS[override.away ?? "det"] ?? NFL_TEAMS.det : override.sport === "mlb" ? MLB_TEAMS[override.away ?? "bos"] ?? MLB_TEAMS.bos : undefined;
  const session = override.session ?? (override.sport === "f1" || override.sport === "nascar" ? "race" : undefined);
  const normalizedSessionKind = session === "qualifying" || session === "sprint" || session === "race" ? session : undefined;
  const label = venue?.label ?? (override.sport === "f1" ? "Kiosk Test Circuit" : override.sport === "nascar" ? "Kiosk Test Speedway" : home?.name ?? "Kiosk Test Venue");
  const title = override.sport === "nfl" || override.sport === "mlb"
    ? `${away?.name ?? "Away"} at ${home?.name ?? "Home"}`
    : `${label} Grand Prix`;
  return {
    id: `kiosk-test-${override.sport}`,
    sport: override.sport,
    title: override.sport === "nascar" ? `${label} 400` : title,
    start: now,
    status: "live",
    statusDetail: session ? `${sessionLabel(session)} · TEST` : "Live · TEST",
    ...(away ? { awayTeam: { ...away, score: 17 } } : {}),
    ...(home ? { homeTeam: { ...home, score: 24 } } : {}),
    venue: label,
    broadcast: "Kiosk Test",
    source: "kiosk-test",
    metadata: {
      ...(session ? { sessionType: sessionLabel(session) } : {}),
      ...(normalizedSessionKind ? { sessionKind: normalizedSessionKind } : {}),
      ...(venue?.country ? { country: venue.country } : {}),
      ...(venue?.track ? { track: venue.track } : {}),
      ...(override.sport === "f1" ? { circuit: label } : {}),
    },
  };
}
