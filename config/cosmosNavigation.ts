import type { CosmicIconName } from "@/components/cosmic-icons";

export interface CosmosNavigationItem {
  id: string;
  name: string;
  route: string;
  icon: CosmicIconName;
  description: string;
}

export const cosmosNavigation: CosmosNavigationItem[] = [
  { id: "home", name: "Home", route: "/os", icon: "dashboard", description: "Your Cosmos overview." },
  { id: "school", name: "School", route: "/school", icon: "school", description: "Classes, assignments, grades, and academic progress." },
  { id: "calendar", name: "Calendar", route: "/calendar", icon: "calendar", description: "Schedule, events, and availability." },
  { id: "tasks", name: "Tasks", route: "/tasks", icon: "tasks", description: "Today, upcoming work, and task lists." },
  { id: "projects", name: "Projects", route: "/projects", icon: "projects", description: "Active projects, milestones, and progress." },
  { id: "notes", name: "Notes / Brain", route: "/notes", icon: "notes", description: "Notes, ideas, references, and saved knowledge." },
  { id: "finance", name: "Finance", route: "/finance", icon: "finance", description: "Safe to Spend, bills, savings, and financial goals." },
  { id: "health", name: "Health", route: "/health", icon: "complete", description: "Fitness, nutrition, sleep, and wellness." },
  { id: "garage", name: "Garage", route: "/garage", icon: "garage", description: "Vehicles, maintenance, repairs, and builds." },
  { id: "sports", name: "Sports", route: "/sports", icon: "sports", description: "Games, races, teams, scores, and schedules." },
  { id: "media", name: "Media", route: "/media", icon: "music", description: "Music, shows, entertainment, and playback." },
  { id: "cosmic", name: "Cosmic", route: "/assistant", icon: "cosmic-ai", description: "Your personalized AI assistant." },
  { id: "devices", name: "Devices", route: "/devices", icon: "system", description: "Kiosk, displays, connected devices, and control." },
  { id: "settings", name: "Settings", route: "/settings", icon: "settings", description: "Appearance, integrations, privacy, and preferences." },
];

export function cosmosNavigationItemForPath(pathname: string) {
  return cosmosNavigation.find((item) =>
    item.route === "/os"
      ? pathname === "/os" || pathname === "/os/"
      : pathname === item.route || pathname.startsWith(`${item.route}/`),
  );
}
