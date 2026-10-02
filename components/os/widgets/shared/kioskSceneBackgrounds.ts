import type { SportsTeam } from "@/core/contracts/Sports";
import { resolveSportsTeamIdentity } from "@/services/sports/identity";

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
