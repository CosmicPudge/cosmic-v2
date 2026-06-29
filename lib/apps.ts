import { WindowId } from "@/stores/windowStore";

export interface CosmicApp {
  id: WindowId;
  name: string;
  icon: string;
  dock: boolean;
  widget: boolean;
}

export const apps: CosmicApp[] = [
  { id: "weather",   name: "Weather",   icon: "🌤️", dock: true,  widget: true },
  { id: "calendar",  name: "Calendar",  icon: "📅", dock: true,  widget: true },
  { id: "sports",    name: "Sports",    icon: "⚾", dock: true,  widget: true },
  { id: "garage",    name: "Garage",    icon: "🚗", dock: true,  widget: true },
  { id: "settings",  name: "Settings",  icon: "⚙️", dock: true,  widget: false },

  { id: "assistant", name: "Assistant", icon: "🤖", dock: false, widget: true },
  { id: "school",    name: "School",    icon: "🎓", dock: false, widget: true },
  { id: "notes",     name: "Notes",     icon: "📝", dock: false, widget: true },
  { id: "projects",  name: "Projects",  icon: "📂", dock: false, widget: true },
  { id: "outlook",   name: "Outlook",   icon: "✉️", dock: false, widget: true },
  { id: "music",     name: "Music",     icon: "🎵", dock: false, widget: true },
  { id: "files",     name: "Files",     icon: "📁", dock: false, widget: false },
];