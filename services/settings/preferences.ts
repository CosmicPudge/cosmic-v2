import type { CosmicUserPreferences } from "@/core/contracts/Settings";

export const neutralPreferences: CosmicUserPreferences = {
  version: 1,
  sports: { enabledSports: ["mlb", "nfl", "nba", "mls", "f1", "nascar"], followedTeams: [], followedDrivers: [], followedConstructors: [], notifications: { gameStartingSoon: false, gameStarted: false, scoreChange: false, closeGameLate: false, finalResult: false, qualifyingStartingSoon: false, raceStartingSoon: false, followedResult: false } },
  garage: { notifications: { maintenanceDueSoon: false, maintenanceOverdue: false, criticalIssueReminder: false, vehicleReminderDue: false, diagnosticCodeDetected: false, connectedVehicleNeedsAttention: false } },
  dashboard: { visibleWidgets: [], widgetOrder: [], widgetSizes: {}, contextDensity: "balanced" },
  modules: { sports: true, finance: true, school: true, garage: true, mail: true, calendar: true, projects: true, notes: true },
  context: { enabledSources: [], suppressedKinds: [] },
};

export const referencePreferences: CosmicUserPreferences = {
  ...neutralPreferences,
  sports: {
    enabledSports: ["mlb", "nfl", "nba", "mls", "f1", "nascar"],
    followedTeams: [
      { sport: "mlb", provider: "mlb", teamId: "108", label: "Los Angeles Angels" },
      { sport: "nfl", provider: "espn", teamId: "9", label: "Green Bay Packers" },
      { sport: "college-football", provider: "espn", teamId: "328", label: "Utah State Aggies" },
    ],
    followedDrivers: [{ id: "max-verstappen", label: "Max Verstappen" }],
    followedConstructors: [{ id: "red-bull-racing", label: "Red Bull Racing" }],
    notifications: neutralPreferences.sports.notifications,
  },
  modules: { ...neutralPreferences.modules },
};

export function clonePreferences(preferences: CosmicUserPreferences): CosmicUserPreferences {
  return JSON.parse(JSON.stringify(preferences)) as CosmicUserPreferences;
}

export function preferencesForProfile(profileId: "neutral" | "reference" | "sports-heavy" | "student" | "minimal"): CosmicUserPreferences {
  if (profileId === "reference") return clonePreferences(referencePreferences);
  if (profileId === "sports-heavy") return { ...clonePreferences(referencePreferences), modules: { ...neutralPreferences.modules, sports: true, finance: false, school: false, garage: false } };
  if (profileId === "student") return { ...clonePreferences(neutralPreferences), modules: { ...neutralPreferences.modules, finance: true, school: true, sports: false, garage: false } };
  if (profileId === "minimal") return { ...clonePreferences(neutralPreferences), modules: { sports: false, finance: false, school: false, garage: false, mail: false, calendar: true, projects: false, notes: true }, context: { enabledSources: ["calendar", "clock"], suppressedKinds: [] } };
  return clonePreferences(neutralPreferences);
}
