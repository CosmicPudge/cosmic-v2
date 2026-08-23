export type AdPolicy = "safe" | "limited" | "prohibited";
export type AdFormat = "banner" | "inline-card" | "sidebar" | "compact";
export type AdProviderMode = "disabled" | "placeholder" | "test" | "live";
export type AdProviderName = "google-adsense";
export type AdSurface = "dashboard" | "garage" | "sports" | "search" | "context" | "weather" | "calendar" | "mail" | "finance" | "notes" | "projects" | "school" | "music" | "settings" | "account" | "admin" | "support" | "cosmic-plus";
export type AdPlacementId = "dashboard.primary.after" | "dashboard.feed.middle" | "dashboard.feed.lower" | "garage.overview.inline" | "sports.home.inline" | "search.results.inline" | "weather.overview.inline" | "calendar.overview.peripheral" | "projects.overview.inline" | "school.overview.inline";

export interface AdPlacement { id: AdPlacementId; surface: AdSurface; format: AdFormat; policy: AdPolicy; privacy: "public-context"; label: string; breakpoint: "all" | "mobile-tablet" | "desktop"; priority: number; minContentSeparation: number; enabled: boolean; providerSlotEnv?: string; }

export const adPolicies: Record<AdSurface, AdPolicy> = {
  dashboard: "safe", garage: "limited", sports: "safe", search: "limited", context: "prohibited", weather: "limited", calendar: "limited", mail: "prohibited", finance: "prohibited", notes: "prohibited", projects: "limited", school: "limited", music: "limited", settings: "prohibited", account: "prohibited", admin: "prohibited", support: "prohibited", "cosmic-plus": "prohibited",
};

export const adPlacements: AdPlacement[] = [
  { id: "dashboard.primary.after", surface: "dashboard", format: "banner", policy: "safe", privacy: "public-context", label: "Dashboard primary boundary", breakpoint: "all", priority: 1, minContentSeparation: 4, enabled: true, providerSlotEnv: "NEXT_PUBLIC_ADSENSE_SLOT_DASHBOARD_PRIMARY" },
  { id: "dashboard.feed.middle", surface: "dashboard", format: "banner", policy: "safe", privacy: "public-context", label: "Dashboard middle feed", breakpoint: "all", priority: 2, minContentSeparation: 5, enabled: true, providerSlotEnv: "NEXT_PUBLIC_ADSENSE_SLOT_DASHBOARD_MIDDLE" },
  { id: "dashboard.feed.lower", surface: "dashboard", format: "banner", policy: "safe", privacy: "public-context", label: "Dashboard lower feed", breakpoint: "all", priority: 3, minContentSeparation: 5, enabled: true, providerSlotEnv: "NEXT_PUBLIC_ADSENSE_SLOT_DASHBOARD_LOWER" },
  { id: "garage.overview.inline", surface: "garage", format: "inline-card", policy: "limited", privacy: "public-context", label: "Garage overview", breakpoint: "all", priority: 1, minContentSeparation: 4, enabled: true, providerSlotEnv: "NEXT_PUBLIC_ADSENSE_SLOT_GARAGE" },
  { id: "sports.home.inline", surface: "sports", format: "inline-card", policy: "safe", privacy: "public-context", label: "Sports home", breakpoint: "all", priority: 1, minContentSeparation: 4, enabled: true, providerSlotEnv: "NEXT_PUBLIC_ADSENSE_SLOT_SPORTS" },
  { id: "search.results.inline", surface: "search", format: "compact", policy: "limited", privacy: "public-context", label: "Search results", breakpoint: "all", priority: 1, minContentSeparation: 4, enabled: true, providerSlotEnv: "NEXT_PUBLIC_ADSENSE_SLOT_SEARCH" },
  { id: "weather.overview.inline", surface: "weather", format: "compact", policy: "limited", privacy: "public-context", label: "Weather overview", breakpoint: "all", priority: 1, minContentSeparation: 4, enabled: true, providerSlotEnv: "NEXT_PUBLIC_ADSENSE_SLOT_WEATHER" },
  { id: "calendar.overview.peripheral", surface: "calendar", format: "sidebar", policy: "limited", privacy: "public-context", label: "Calendar peripheral", breakpoint: "desktop", priority: 1, minContentSeparation: 4, enabled: true, providerSlotEnv: "NEXT_PUBLIC_ADSENSE_SLOT_CALENDAR" },
  { id: "projects.overview.inline", surface: "projects", format: "inline-card", policy: "limited", privacy: "public-context", label: "Projects overview", breakpoint: "all", priority: 1, minContentSeparation: 4, enabled: true, providerSlotEnv: "NEXT_PUBLIC_ADSENSE_SLOT_PROJECTS" },
  { id: "school.overview.inline", surface: "school", format: "inline-card", policy: "limited", privacy: "public-context", label: "School overview", breakpoint: "all", priority: 1, minContentSeparation: 4, enabled: true, providerSlotEnv: "NEXT_PUBLIC_ADSENSE_SLOT_SCHOOL" },
];

export function getDashboardAdPlan(widgetCount: number): Array<{ placementId: AdPlacementId; afterIndex: number }> {
  if (widgetCount < 4) return [];
  const plan: Array<{ placementId: AdPlacementId; afterIndex: number }> = [{ placementId: "dashboard.primary.after", afterIndex: Math.max(4, Math.ceil(widgetCount / 3)) }];
  if (widgetCount >= 10) plan.push({ placementId: "dashboard.feed.middle", afterIndex: Math.max(plan[0].afterIndex + 5, Math.ceil(widgetCount * 2 / 3)) });
  if (widgetCount >= 16) plan.push({ placementId: "dashboard.feed.lower", afterIndex: Math.max(plan[1].afterIndex + 5, widgetCount - 2) });
  return plan;
}

export interface AdRuntimeConfig { provider: AdProviderName; mode: AdProviderMode; enabled: boolean; publisherId?: string; slots: Partial<Record<AdPlacementId, string>>; consentRequired: boolean; }
const slotEnv: Record<AdPlacementId, string | undefined> = Object.fromEntries(adPlacements.map((placement) => [placement.id, placement.providerSlotEnv])) as Record<AdPlacementId, string | undefined>;
export function getAdRuntimeConfig(): AdRuntimeConfig {
  const rawMode = process.env.NEXT_PUBLIC_COSMIC_ADS_MODE;
  const mode: AdProviderMode = rawMode === "test" || rawMode === "live" || rawMode === "placeholder" ? rawMode : "disabled";
  const slots = Object.fromEntries(Object.entries(slotEnv).flatMap(([id, env]) => { const value = env ? process.env[env] : undefined; return value ? [[id, value]] : []; })) as Partial<Record<AdPlacementId, string>>;
  return { provider: "google-adsense", mode: process.env.NEXT_PUBLIC_COSMIC_ADS_ENABLED === "false" ? "disabled" : mode, enabled: process.env.NEXT_PUBLIC_COSMIC_ADS_ENABLED === "true", publisherId: process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID, slots, consentRequired: true };
}

export function getAdPlacement(id: AdPlacementId) { return adPlacements.find((placement) => placement.id === id); }
