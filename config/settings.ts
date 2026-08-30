import type { SearchCategory } from "@/core/contracts/Search";

export type SettingsSectionId =
  | "general"
  | "appearance"
  | "background"
  | "system"
  | "dashboard"
  | "ambient"
  | "clock"
  | "connections"
  | "apps"
  | "ai"
  | "search"
  | "privacy-data"
  | "about";

export interface SettingsSectionMetadata {
  id: SettingsSectionId;
  name: string;
  description: string;
  keywords: string[];
  icon: string;
  href: string;
  category: SearchCategory;
}

export const settingsSections: SettingsSectionMetadata[] = [
  { id: "general", name: "General", description: "Overview and default Cosmic behavior.", keywords: ["home", "overview", "preferences"], icon: "⌘", href: "/settings#general", category: "settings" },
  { id: "appearance", name: "Appearance", description: "Reduce decorative visual effects.", keywords: ["effects", "accessibility", "visual"], icon: "◐", href: "/settings#appearance", category: "settings" },
  { id: "background", name: "Background", description: "Tune the live celestial canvas.", keywords: ["stars", "canvas", "intensity", "motion"], icon: "✦", href: "/settings#background", category: "settings" },
  { id: "system", name: "System", description: "Performance, device profile, install, and browser capabilities.", keywords: ["performance mode", "device profile", "display kiosk", "wake lock", "notifications", "install cosmic", "system diagnostics"], icon: "⌘", href: "/settings#system", category: "settings" },
  { id: "dashboard", name: "Dashboard", description: "Review the canonical widget layout.", keywords: ["widgets", "layout", "home"], icon: "▦", href: "/settings#dashboard", category: "settings" },
  { id: "ambient", name: "Ambient", description: "Choose when Cosmic enters its idle display.", keywords: ["idle", "screensaver", "timeout", "never"], icon: "☾", href: "/settings#ambient", category: "settings" },
  { id: "clock", name: "Clock", description: "Time format and Clock data status.", keywords: ["time", "12 hour", "24 hour", "alarms", "timers"], icon: "◷", href: "/settings#clock", category: "settings" },
  { id: "connections", name: "Connections", description: "Calendar, Spotify, Gmail, and Weather status.", keywords: ["accounts", "oauth", "calendar", "spotify", "gmail", "weather"], icon: "⌁", href: "/settings#connections", category: "settings" },
  { id: "apps", name: "Apps", description: "Open apps and review local data summaries.", keywords: ["garage", "projects", "notes", "sports"], icon: "◫", href: "/settings#apps", category: "settings" },
  { id: "ai", name: "Cosmic AI", description: "Control AI access to public and private Cosmic context.", keywords: ["assistant", "ai", "permissions", "privacy", "web"], icon: "✧", href: "/settings#ai", category: "settings" },
  { id: "search", name: "Search", description: "Recent-search history and searchable destinations.", keywords: ["find", "history", "recents", "command"], icon: "⌕", href: "/settings#search", category: "settings" },
  { id: "privacy-data", name: "Privacy & Data", description: "Export, import, or reset browser-local Cosmic data.", keywords: ["backup", "restore", "export", "import", "reset", "delete"], icon: "◇", href: "/settings#privacy-data", category: "settings" },
  { id: "about", name: "About", description: "Version, storage model, and diagnostics.", keywords: ["version", "diagnostics", "storage", "local first"], icon: "ⓘ", href: "/settings#about", category: "settings" },
];
