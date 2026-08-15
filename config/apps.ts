export interface CosmicApp {
  id: string;
  name: string;
  icon: string;
  route: string;
  description: string;
  keywords: string[];
  color?: string;
  enabled?: boolean;
  category?: "system" | "productivity" | "media";
}

/** Canonical route and discovery metadata for built-in Cosmic apps. */
export const apps: CosmicApp[] = [
  { id: "dashboard", name: "Dashboard", icon: "⌘", route: "/os", description: "Your Cosmic home.", keywords: ["home", "desktop", "widgets"], category: "system" },
  { id: "search", name: "Search", icon: "⌕", route: "/search", description: "Find anything in Cosmic.", keywords: ["find", "spotlight", "command"], category: "system" },
  { id: "system", name: "System", icon: "⌘", route: "/system", description: "Device, display, network, storage, install, and browser capabilities.", keywords: ["device", "performance", "network", "storage", "install", "notifications", "pwa"], category: "system" },
  { id: "calendar", name: "Calendar", icon: "📅", route: "/calendar", description: "Events, schedule, and availability.", keywords: ["schedule", "events", "agenda"], category: "productivity" },
  { id: "gmail", name: "Gmail", icon: "✉", route: "/gmail", description: "Recent Gmail messages.", keywords: ["mail", "email", "inbox"], category: "productivity" },
  { id: "outlook", name: "Outlook", icon: "▣", route: "/outlook", description: "Outlook mail and calendar.", keywords: ["mail", "email", "inbox"], category: "productivity" },
  { id: "school", name: "School", icon: "🎓", route: "/school", description: "Courses, assignments, and goals.", keywords: ["class", "course", "assignments", "grades"], category: "productivity" },
  { id: "sports", name: "Sports", icon: "⚾", route: "/sports", description: "Live and upcoming sports.", keywords: ["games", "scores", "teams", "f1", "nascar"], category: "media" },
  { id: "garage", name: "Garage", icon: "🚗", route: "/garage", description: "Vehicles, service, and maintenance.", keywords: ["car", "vehicle", "maintenance", "service"], category: "productivity" },
  { id: "projects", name: "Projects", icon: "◫", route: "/projects", description: "Projects, tasks, and milestones.", keywords: ["task", "work", "milestone", "todo"], category: "productivity" },
  { id: "notes", name: "Notes", icon: "✎", route: "/notes", description: "Notes, ideas, and references.", keywords: ["note", "writing", "memo", "tags"], category: "productivity" },
  { id: "music", name: "Music", icon: "♫", route: "/music", description: "Playback and current listening.", keywords: ["spotify", "song", "track", "album"], category: "media" },
  { id: "clock", name: "Clock", icon: "◷", route: "/clock", description: "World clocks, alarms, and timers.", keywords: ["time", "timer", "alarm", "stopwatch"], category: "system" },
  { id: "files", name: "Files", icon: "▤", route: "/files", description: "Your Cosmic files.", keywords: ["documents", "folders", "storage"], category: "productivity" },
  { id: "weather", name: "Weather", icon: "🌤", route: "/weather", description: "Current conditions and forecasts.", keywords: ["forecast", "temperature", "rain"], category: "system" },
  { id: "assistant", name: "Assistant", icon: "✦", route: "/assistant", description: "Open the existing Cosmic assistant.", keywords: ["cosmic", "help"], category: "productivity" },
  { id: "settings", name: "Settings", icon: "⚙", route: "/settings", description: "Existing Cosmic preferences.", keywords: ["preferences", "configuration", "options"], category: "system" },
];
