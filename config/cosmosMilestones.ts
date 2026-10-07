export const cosmosMilestones = [
  "Shared Foundation",
  "Home",
  "School",
  "Calendar",
  "Tasks",
  "Projects",
  "Notes / Brain",
  "Finance",
  "Health",
  "Garage",
  "Sports",
  "Media",
  "Cosmic AI",
  "Devices / Kiosk",
  "Settings",
  "Final Integration + Polish",
] as const;

export const foundationChecks = [
  ["Canonical 14-page navigation", true],
  ["Desktop sidebar", true],
  ["Responsive mobile navigation", true],
  ["Cosmos branding", true],
  ["Global top bar", true],
  ["Shared page header pattern", true],
  ["Clear-glass visual system", true],
  ["Glass / solid surface mode", true],
  ["Shared card surface", true],
  ["Home shell uses shared chrome", true],
  ["Placeholder routes for new pages", true],
  ["PWA branding", true],
  ["Responsive / focus / reduced-motion baseline", true],
  ["Shared buttons, status, progress, loading, empty, error styling", true],
  ["Live weather in top bar", true],
  ["Existing-page shell compatibility", true],
  ["School compatibility", true],
  ["Kiosk regression check", true],
  ["Mobile + tablet QA", false],
  ["Glass / solid QA", false],
  ["TypeScript / lint / build validation", false],
  ["Regression fixes", false],
  ["Dev QA", false],
  ["Progress tracker is live and accurate at /cosmos-progress", true],
  ["Foundation preview is live and working at /cosmos-foundation", true],
  ["Both progress and foundation screens show 100% before milestone close", false],
  ["PR into dev", false],
] as const;

export function getFoundationProgress() {
  const completed = foundationChecks.filter(([, done]) => done).length;
  const total = foundationChecks.length;
  return { completed, total, percent: Math.round((completed / total) * 100) };
}
