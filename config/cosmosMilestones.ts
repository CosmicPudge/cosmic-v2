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
  ["Mobile + tablet QA", true],
  ["Glass / solid QA", true],
  ["TypeScript / lint / build validation", true],
  ["Regression fixes", true],
  ["Dev QA", true],
  ["Progress tracker is live and accurate at /cosmos-progress", true],
  ["Foundation preview is live and working at /cosmos-foundation", true],
  ["Both progress and foundation screens show 100% before milestone close", true],
  ["PR into dev", true],
] as const;

export function getFoundationProgress() {
  const completed = foundationChecks.filter(([, done]) => done).length;
  const total = foundationChecks.length;
  return { completed, total, percent: Math.round((completed / total) * 100) };
}


export const homeChecks = [
  ["Milestone 0 merged into dev", true],
  ["Milestone 1 Home branch created", true],
  ["/os uses shared Cosmos shell", true],
  ["Dedicated /cosmos-home preview route", true],
  ["Approved Home hierarchy implemented", true],
  ["Responsive summary grid baseline", true],
  ["School summary card", true],
  ["Calendar summary card", true],
  ["Tasks summary card", true],
  ["Finance Safe to Spend summary card", true],
  ["Health summary card", true],
  ["Garage summary card", true],
  ["Sports summary card", true],
  ["Projects summary card", true],
  ["Notes summary card", true],
  ["Media summary card", true],
  ["Home cards click through to specialist pages", true],
  ["Home remains summary-first, not interaction-dense", true],
  ["Shared loading / empty / error states", true],
  ["School real-data hookup", true],
  ["Calendar real-data hookup", true],
  ["Tasks real-data hookup", true],
  ["Finance real-data hookup", true],
  ["Health real-data hookup", true],
  ["Garage real-data hookup", true],
  ["Sports real-data hookup", true],
  ["Projects / Notes / Media real-data hookup", true],
  ["Accessibility and keyboard QA", true],
  ["Mobile + tablet QA", true],
  ["Glass / solid QA", true],
  ["TypeScript / lint / build validation", true],
  ["Regression fixes", true],
  ["Dev QA", true],
  ["Progress tracker is live and accurate for Milestone 1", true],
  ["Home preview is live and working at /cosmos-home", true],
  ["Both progress and Home screens show 100% before milestone close", true],
  ["PR into dev", true],
] as const;

export function getHomeProgress() {
  const completed = homeChecks.filter(([, done]) => done).length;
  const total = homeChecks.length;
  return { completed, total, percent: Math.round((completed / total) * 100) };
}


export const schoolChecks = [
  ["Milestone 1 merged into dev", true],
  ["Milestone 2 School branch created", true],
  ["School uses shared Cosmos shell", true],
  ["Dedicated /cosmos-school preview route", true],
  ["Approved School overview hierarchy implemented", true],
  ["Overview / Courses / Assignments / Calendar / Analytics navigation", true],
  ["Current GPA metric", true],
  ["Next Class metric", true],
  ["Due Soon metric", true],
  ["Credits & Progress metric", true],
  ["Today's Classes panel", true],
  ["Upcoming Assignments panel", true],
  ["Weekly Workload visualization", true],
  ["Current Courses panel", true],
  ["Feedback / Announcements panel", true],
  ["School overview real-data hookup", true],
  ["Provider degraded-state handling", true],
  ["Loading / empty states", true],
  ["Analytics route baseline", true],
  ["Course navigation compatibility", true],
  ["Assignment navigation compatibility", true],
  ["Calendar navigation compatibility", true],
  ["School detail-page visual consistency", true],
  ["Responsive mobile + tablet QA", true],
  ["Glass / solid QA", true],
  ["Accessibility and keyboard QA", true],
  ["TypeScript / lint / build validation", true],
  ["Regression fixes", true],
  ["Dev QA", true],
  ["Progress tracker is live and accurate for Milestone 2", true],
  ["School preview is live and working at /cosmos-school", true],
  ["Both progress and School screens show 100% before milestone close", true],
  ["PR into dev", true],
] as const;

export function getSchoolProgress() {
  const completed = schoolChecks.filter(([, done]) => done).length;
  const total = schoolChecks.length;
  return { completed, total, percent: Math.round((completed / total) * 100) };
}
