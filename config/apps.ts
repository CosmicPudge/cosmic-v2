export interface CosmicApp {
  id: string;
  name: string;
  icon: string;
 route: string;

  color?: string;

  enabled?: boolean;

  category?: "system" | "productivity" | "media";
}

export const apps: CosmicApp[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    icon: "🏠",
    route: "/os",
  },
  {
    id: "cosmic",
    name: "Cosmic",
    icon: "🤖",
    route: "/cosmic",
  },
  {
    id: "weather",
    name: "Weather",
    icon: "🌤",
    route: "/weather",
  },
  {
    id: "calendar",
    name: "Calendar",
    icon: "📅",
    route: "/calendar",
  },
  {
    id: "sports",
    name: "Sports",
    icon: "⚾",
    route: "/sports",
  },
  {
    id: "garage",
    name: "Garage",
    icon: "🚗",
    route: "/garage",
  },
  {
    id: "school",
    name: "School",
    icon: "🎓",
    route: "/school",
  },
  {
    id: "settings",
    name: "Settings",
    icon: "⚙️",
    route: "/settings",
  },
];