import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const exists = (path) => fs.existsSync(path);
const checks = [];

function check(label, pass) {
  checks.push([label, Boolean(pass)]);
  if (!pass) process.exitCode = 1;
}

const nav = read("config/cosmosNavigation.ts");
const sidebar = read("components/os/layout/Sidebar.tsx");
const shell = read("components/os/app/AppShell.tsx");
const topbar = read("components/os/layout/CosmosTopBar.tsx");
const settingsProvider = read("components/apps/settings/SettingsProvider.tsx");
const settingsRepo = read("services/settings/localRepository.ts");
const foundationCss = read("styles/cosmos-foundation.css");
const schoolLayout = read("components/school/layout/SchoolLayout.tsx");

const navItems = [...nav.matchAll(/\{ id: "[^"]+", name: "[^"]+", route: "[^"]+"/g)];

check("14 canonical Cosmos navigation entries", navItems.length === 14);
check("Cosmos brand is used in shared navigation", sidebar.includes(">COSMOS<") && !sidebar.includes("COSMIC OS"));
check("Desktop sidebar breakpoint exists", sidebar.includes("hidden lg:flex"));
check("Mobile navigation breakpoint exists", shell.includes("lg:hidden"));
check("Global top bar is mounted by AppShell", shell.includes("<CosmosTopBar />"));
check("Top bar uses live weather hook", topbar.includes("useWeather()") && topbar.includes("weather.temp"));
check("Search remains globally accessible", topbar.includes("openSearch()"));
check("Glass and solid setting persists", settingsRepo.includes("setSurfaceStyle") && settingsRepo.includes('"glass"') && settingsRepo.includes('"solid"'));
check("Surface style is exposed on document root", settingsProvider.includes("dataset.cosmosSurface"));
check("Solid mode disables blur", foundationCss.includes('html[data-cosmos-surface="solid"]'));
check("Reduced-motion foundation styles exist", foundationCss.includes("@media (prefers-reduced-motion: reduce)"));
check("School mounts inside shared AppShell", schoolLayout.includes('<AppShell app="school">'));

for (const route of ["tasks", "health", "media", "devices"]) {
  check(route + " foundation route exists", exists("app/" + route + "/page.tsx"));
}

check("Progress screen exists", exists("app/cosmos-progress/page.tsx"));
check("Foundation preview exists", exists("app/cosmos-foundation/page.tsx"));

const failed = checks.filter(([, pass]) => !pass);
for (const [label, pass] of checks) {
  console.log((pass ? "PASS" : "FAIL") + "  " + label);
}
console.log("\n" + (checks.length - failed.length) + "/" + checks.length + " foundation structure checks passed.");

if (failed.length) {
  console.error("\nFailed checks:\n" + failed.map(([label]) => "- " + label).join("\n"));
}
