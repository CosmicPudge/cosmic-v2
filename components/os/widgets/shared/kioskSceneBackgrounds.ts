export type KioskSceneFamily = "school" | "sports" | "notifications" | "system";

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
