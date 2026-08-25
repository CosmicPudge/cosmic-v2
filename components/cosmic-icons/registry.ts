import type { CosmicIconName, CosmicWeatherCondition } from "./types";

/** Central identity registry. Artwork is rendered by CosmicGlyph so navigation never selects glyphs ad hoc. */
export const cosmicIconRegistry: Record<CosmicIconName, true> = Object.fromEntries(
  [
    "dashboard", "calendar", "school", "projects", "notes", "music", "finance", "sports", "garage", "clock", "notifications", "cosmic-ai", "gmail", "outlook", "files", "weather", "search", "settings", "account", "tasks", "reminders", "system", "sync", "network", "tools", "data", "cosmic-plus", "live", "on-air", "online", "offline", "syncing", "loading", "complete", "warning", "error", "information", "favorite", "locked", "unlocked", "download", "upload", "income", "expense", "savings", "credit-card", "investment", "transfer",
  ].map((name) => [name, true]),
) as Record<CosmicIconName, true>;

export const weatherIconRegistry: Record<CosmicWeatherCondition, true> = {
  "clear-day": true, "clear-night": true, "partly-cloudy": true, cloudy: true,
  rain: true, "heavy-rain": true, thunderstorm: true, snow: true, fog: true,
  wind: true, sunrise: true, sunset: true,
};

export const iconLabels: Record<CosmicIconName, string> = {
  dashboard: "Dashboard", calendar: "Calendar", school: "School",
  projects: "Projects", notes: "Notes", music: "Music", finance: "Finance", sports: "Sports",
  garage: "Garage", clock: "Clock", notifications: "Notifications", "cosmic-ai": "Cosmic AI",
  gmail: "Gmail", outlook: "Outlook", files: "Files", weather: "Weather", search: "Search", settings: "Settings",
  account: "Account", tasks: "Tasks", reminders: "Reminders", system: "System Status", sync: "Sync",
  network: "Network", tools: "Tools", data: "Data", "cosmic-plus": "Cosmic+", live: "Live",
  "on-air": "On air", online: "Online", offline: "Offline", syncing: "Syncing", loading: "Loading",
  complete: "Complete", warning: "Warning", error: "Error", information: "Information",
  favorite: "Favorite", locked: "Locked", unlocked: "Unlocked", download: "Download", upload: "Upload",
  income: "Income", expense: "Expense", savings: "Savings", "credit-card": "Credit card",
  investment: "Investment", transfer: "Transfer",
};
