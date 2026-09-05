export type DashboardImageId =
  | "quick-brief-morning" | "quick-brief-day" | "quick-brief-evening" | "quick-brief-night"
  | "weather-clear-day" | "weather-clear-night" | "weather-partly-cloudy-day" | "weather-partly-cloudy-night"
  | "weather-cloudy" | "weather-rain" | "weather-heavy-rain" | "weather-thunderstorm" | "weather-snow" | "weather-fog"
  | "calendar" | "clock" | "clock-morning" | "clock-day" | "clock-evening" | "clock-night" | "sports" | "sports-mlb" | "sports-f1" | "finance" | "school" | "music" | "garage" | "projects" | "notes" | "outlook" | "system" | "global-search" | "daily-briefing" | "cosmic-ai" | "notifications";

export interface DashboardImageAsset { id: DashboardImageId; src?: string; objectPosition: string; overlay: "standard" | "strong"; }

const image = (id: DashboardImageId, src: string | undefined, objectPosition = "center center", overlay: DashboardImageAsset["overlay"] = "standard"): DashboardImageAsset => ({ id, src, objectPosition, overlay });

export const DASHBOARD_IMAGE_MANIFEST: Record<DashboardImageId, DashboardImageAsset> = {
  "quick-brief-morning": image("quick-brief-morning", "/dashboard/quick-brief/morning.webp", "center center", "strong"), "quick-brief-day": image("quick-brief-day", "/dashboard/quick-brief/day.webp", "center center", "strong"), "quick-brief-evening": image("quick-brief-evening", "/dashboard/quick-brief/evening.webp", "center center", "strong"), "quick-brief-night": image("quick-brief-night", "/dashboard/quick-brief/night.webp", "center center", "strong"),
  "weather-clear-day": image("weather-clear-day", "/kiosk/scenes/weather/weather-clear-day.png"), "weather-clear-night": image("weather-clear-night", "/kiosk/scenes/weather/weather-clear-night.png"),
  "weather-partly-cloudy-day": image("weather-partly-cloudy-day", "/kiosk/scenes/weather/weather-partly-cloudy-day.png"), "weather-partly-cloudy-night": image("weather-partly-cloudy-night", "/kiosk/scenes/weather/weather-partly-cloudy-night.png"),
  "weather-cloudy": image("weather-cloudy", "/kiosk/scenes/weather/weather-cloudy.png"), "weather-rain": image("weather-rain", "/kiosk/scenes/weather/weather-rain.png"), "weather-heavy-rain": image("weather-heavy-rain", "/kiosk/scenes/weather/weather-heavy-rain.png"),
  "weather-thunderstorm": image("weather-thunderstorm", "/kiosk/scenes/weather/weather-thunderstorm.png"), "weather-snow": image("weather-snow", "/kiosk/scenes/weather/weather-snow.png"), "weather-fog": image("weather-fog", "/kiosk/scenes/weather/weather-fog.png"),
  calendar: image("calendar", "/kiosk/scenes/calendar/calendar-cosmic-workspace.png", "center center", "strong"), clock: image("clock", "/dashboard/clock-day.webp", "center center", "strong"), "clock-morning": image("clock-morning", "/dashboard/quick-brief/morning.webp", "center center", "strong"), "clock-day": image("clock-day", "/dashboard/clock-day.webp", "center center", "strong"), "clock-evening": image("clock-evening", "/dashboard/quick-brief/evening.webp", "center center", "strong"), "clock-night": image("clock-night", "/dashboard/quick-brief/night.webp", "center center", "strong"),
  sports: image("sports", "/dashboard/sports/stadium.webp", "center center", "strong"), "sports-mlb": image("sports-mlb", "/dashboard/sports/baseball.webp", "center center", "strong"), "sports-f1": image("sports-f1", "/dashboard/sports/motorsport.webp", "center center", "strong"), finance: image("finance", "/dashboard/finance/financial-district.webp", "center center", "strong"), school: image("school", "/dashboard/school/campus-study.webp", "center center", "strong"), music: image("music", "/dashboard/music/concert-stage.webp", "center center", "strong"), garage: image("garage", "/dashboard/garage/automotive-workshop.webp", "center center", "strong"), projects: image("projects", "/dashboard/projects/maker-engineering.webp", "center center", "strong"), notes: image("notes", "/dashboard/notes/writing-desk.webp", "center center", "strong"), outlook: image("outlook", "/dashboard/outlook/workday.webp", "center center", "strong"), system: image("system", "/dashboard/system/workstation.webp", "center center", "strong"), "global-search": image("global-search", "/dashboard/search/research-library.webp", "center center", "strong"), "daily-briefing": image("daily-briefing", "/dashboard/briefing/morning.webp", "center center", "strong"), "cosmic-ai": image("cosmic-ai", "/dashboard/ai/computing.webp", "center center", "strong"), notifications: image("notifications", "/dashboard/notifications/connected-devices.webp", "center center", "strong"),
};

export function dashboardImage(id: DashboardImageId) { return DASHBOARD_IMAGE_MANIFEST[id]; }

export function currentClockImage() {
  const hour = new Date().getHours();
  const id = hour < 6 ? "clock-night" : hour < 12 ? "clock-morning" : hour < 17 ? "clock-day" : hour < 22 ? "clock-evening" : "clock-night";
  return dashboardImage(id);
}

export const DASHBOARD_ASSETS_NEEDED = Object.values(DASHBOARD_IMAGE_MANIFEST).filter((asset) => !asset.src).map((asset) => asset.id);
