import type { SportsTeam } from "@/core/contracts/Sports";
import { resolveSportsTeamIdentity } from "@/services/sports/identity";
import { MLB_VENUES } from "@/services/sports/venues/mlb";

export type KioskSceneFamily = "school" | "sports" | "notifications" | "system";

const NFL_STADIUM_ASSETS: Record<string, string> = {
  ari: "/kiosk/scenes/sports/nfl/ari.webp",
  atl: "/kiosk/scenes/sports/nfl/atl.webp",
  bal: "/kiosk/scenes/sports/nfl/bal.webp",
  buf: "/kiosk/scenes/sports/nfl/buf.webp",
  car: "/kiosk/scenes/sports/nfl/car.webp",
  chi: "/kiosk/scenes/sports/nfl/chi.webp",
  cin: "/kiosk/scenes/sports/nfl/cin.webp",
  cle: "/kiosk/scenes/sports/nfl/cle.webp",
  dal: "/kiosk/scenes/sports/nfl/dal.webp",
  den: "/kiosk/scenes/sports/nfl/den.webp",
  det: "/kiosk/scenes/sports/nfl/det.webp",
  gb: "/kiosk/scenes/sports/nfl/gb.webp",
  hou: "/kiosk/scenes/sports/nfl/hou.webp",
  ind: "/kiosk/scenes/sports/nfl/ind.webp",
  jax: "/kiosk/scenes/sports/nfl/jax.webp",
  kc: "/kiosk/scenes/sports/nfl/kc.webp",
  lac: "/kiosk/scenes/sports/nfl/lac.webp",
  lar: "/kiosk/scenes/sports/nfl/lar.webp",
  lv: "/kiosk/scenes/sports/nfl/lv.webp",
  mia: "/kiosk/scenes/sports/nfl/mia.webp",
  min: "/kiosk/scenes/sports/nfl/min.webp",
  ne: "/kiosk/scenes/sports/nfl/ne.webp",
  no: "/kiosk/scenes/sports/nfl/no.webp",
  nyg: "/kiosk/scenes/sports/nfl/nyg.webp",
  nyj: "/kiosk/scenes/sports/nfl/nyj.webp",
  phi: "/kiosk/scenes/sports/nfl/phi.webp",
  pit: "/kiosk/scenes/sports/nfl/pit.webp",
  sf: "/kiosk/scenes/sports/nfl/sf.webp",
  sea: "/kiosk/scenes/sports/nfl/sea.webp",
  tb: "/kiosk/scenes/sports/nfl/tb.webp",
  ten: "/kiosk/scenes/sports/nfl/ten.webp",
  wsh: "/kiosk/scenes/sports/nfl/was.webp",
};

const GENERIC_NFL_STADIUM = "/dashboard/sports/stadium.webp";
const GENERIC_MLB_STADIUM = "/dashboard/sports/baseball.webp";
const GENERIC_MOTORSPORT = "/dashboard/sports/motorsport.webp";

const F1_CIRCUIT_ASSETS: Record<string, string> = {
  "f1-australia": "/kiosk/scenes/sports/f1/f1-australia.webp",
  "f1-china": "/kiosk/scenes/sports/f1/f1-china.webp",
  "f1-japan": "/kiosk/scenes/sports/f1/f1-japan.webp",
  "f1-miami": "/kiosk/scenes/sports/f1/f1-miami.webp",
  "f1-canada": "/kiosk/scenes/sports/f1/f1-canada.webp",
  "f1-monaco": "/kiosk/scenes/sports/f1/f1-monaco.webp",
  "f1-barcelona": "/kiosk/scenes/sports/f1/f1-barcelona.webp",
  "f1-austria": "/kiosk/scenes/sports/f1/f1-austria.webp",
  "f1-silverstone": "/kiosk/scenes/sports/f1/f1-silverstone.webp",
  "f1-spa": "/kiosk/scenes/sports/f1/f1-spa.webp",
  "f1-hungary": "/kiosk/scenes/sports/f1/f1-hungary.webp",
  "f1-monza": "/kiosk/scenes/sports/f1/f1-monza.webp",
  "f1-madrid": "/kiosk/scenes/sports/f1/f1-madrid.webp",
  "f1-baku": "/kiosk/scenes/sports/f1/f1-baku.webp",
  "f1-malaysia": "/kiosk/scenes/sports/f1/f1-malaysia.webp",
  "f1-singapore": "/kiosk/scenes/sports/f1/f1-singapore.webp",
  "f1-austin": "/kiosk/scenes/sports/f1/f1-austin.webp",
  "f1-mexico": "/kiosk/scenes/sports/f1/f1-mexico.webp",
  "f1-brazil": "/kiosk/scenes/sports/f1/f1-brazil.webp",
  "f1-las-vegas": "/kiosk/scenes/sports/f1/f1-las-vegas.webp",
  "f1-qatar": "/kiosk/scenes/sports/f1/f1-qatar.webp",
  "f1-abu-dhabi": "/kiosk/scenes/sports/f1/f1-abu-dhabi.webp",
  "f1-generic": GENERIC_MOTORSPORT,
};

const NASCAR_TRACK_ASSETS: Record<string, string> = {
  "nascar-daytona": "/sports/tracks/nascar/daytona-tri-oval.svg",
  "nascar-cota": "/sports/tracks/nascar/cota-nascar.svg",
  "nascar-las-vegas": "/sports/tracks/nascar/las-vegas.svg",
  "nascar-generic": GENERIC_MOTORSPORT,
};

const MLB_STADIUM_ASSETS: Record<string, string> = Object.fromEntries(MLB_VENUES.map((venue) => [`mlb-${venue.slug}`, venue.imagePath])) as Record<string, string>;
MLB_STADIUM_ASSETS["mlb-generic"] = GENERIC_MLB_STADIUM;

const SCENE_ASSETS: Record<KioskSceneFamily, Record<string, string>> = {
  school: {
    clear: "/dashboard/school/campus-study.webp",
    upcoming: "/dashboard/school/campus-study.webp",
    urgent: "/dashboard/school/campus-study.webp",
    overdue: "/dashboard/school/campus-study.webp",
    unavailable: "/dashboard/school/campus-study.webp",
  },
  sports: {
    default: "/dashboard/sports/stadium.webp",
    nfl: "/dashboard/sports/stadium.webp",
    mlb: "/dashboard/sports/baseball.webp",
    f1: "/dashboard/sports/motorsport.webp",
    nascar: "/dashboard/sports/motorsport.webp",
  },
  notifications: {
    clear: "/dashboard/notifications/connected-devices.webp",
    active: "/dashboard/notifications/connected-devices.webp",
    important: "/dashboard/notifications/connected-devices.webp",
    urgent: "/dashboard/notifications/connected-devices.webp",
  },
  system: {
    healthy: "/dashboard/system/workstation.webp",
    reduced: "/dashboard/system/workstation.webp",
    offline: "/dashboard/system/workstation.webp",
    recovering: "/dashboard/system/workstation.webp",
  },
};

export function selectKioskSceneBackground(family: KioskSceneFamily, state = "steady", variant = "default") {
  const assets = SCENE_ASSETS[family];
  return assets[variant] ?? assets[state] ?? assets.default ?? Object.values(assets)[0];
}

export function selectNflStadiumBackground(homeTeam?: SportsTeam) {
  const identity = resolveSportsTeamIdentity("nfl", homeTeam);
  return identity ? NFL_STADIUM_ASSETS[identity.canonicalId] ?? NFL_STADIUM_ASSETS[identity.abbreviation.toLowerCase()] ?? GENERIC_NFL_STADIUM : GENERIC_NFL_STADIUM;
}

export function selectKioskSportsBackground(backgroundKey?: string) {
  if (!backgroundKey) return undefined;
  if (backgroundKey.startsWith("nfl-")) {
    const abbreviation = backgroundKey.slice(4);
    return NFL_STADIUM_ASSETS[abbreviation] ?? GENERIC_NFL_STADIUM;
  }
  if (backgroundKey.startsWith("mlb-")) return MLB_STADIUM_ASSETS[backgroundKey] ?? GENERIC_MLB_STADIUM;
  if (backgroundKey.startsWith("f1-")) return F1_CIRCUIT_ASSETS[backgroundKey] ?? GENERIC_MOTORSPORT;
  if (backgroundKey.startsWith("nascar-")) return NASCAR_TRACK_ASSETS[backgroundKey] ?? GENERIC_MOTORSPORT;
  return GENERIC_MOTORSPORT;
}
