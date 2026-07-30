import { registerComingSoonApp } from "./core";

const comingSoonApps = [
  ["dashboard", "Dashboard", "Your personalized Cosmic desktop surface.", "⌘", ["Dashboard editing", "Widget layout QA"]],
  ["calendar", "Calendar", "Your schedule, priorities, and day at a glance.", "◫", ["Agenda widget", "Event intelligence"]],
  ["sports", "Sports", "Live scores and the teams that matter to you.", "◉", ["Live game cards", "Team tracking"]],
  ["garage", "Garage", "A calm command center for your vehicles.", "◆", ["Maintenance timeline", "Vehicle insights"]],
  ["music", "Music", "Now playing, queue controls, and listening history.", "♫", ["Playback controls", "Listening activity"]],
  ["notes", "Notes", "Capture ideas and keep your workspace in context.", "✎", ["Quick capture", "Pinned notes"]],
  ["files", "Files", "A focused view of the work you need right now.", "▣", ["Recent files", "Storage intelligence"]],
  ["assistant", "Assistant", "A private, proactive companion for Cosmic.", "✦", ["Contextual assistance", "Suggested actions"]],
  ["settings", "Settings", "Personalize every detail of your Cosmic experience.", "⚙", ["Appearance controls", "System preferences"]],
] as const;

for (const [id, title, description, icon, plannedFeatures] of comingSoonApps) {
  registerComingSoonApp({ id, title, description, route: `/${id}`, icon, plannedFeatures });
}
