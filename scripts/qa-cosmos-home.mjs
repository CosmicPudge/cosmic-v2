import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const exists = (path) => fs.existsSync(path);
const checks = [];

function check(label, pass) {
  checks.push([label, Boolean(pass)]);
  if (!pass) process.exitCode = 1;
}

const home = read("components/home/CosmosHome.tsx");
const os = read("components/os/core/OperatingSystem.tsx");
const progress = read("app/cosmos-progress/page.tsx");

check("Home component exists", exists("components/home/CosmosHome.tsx"));
check("Home preview route exists", exists("app/cosmos-home/page.tsx"));
check("/os mounts CosmosHome", os.includes("<CosmosHome />"));
check("Home uses shared AppHeader", home.includes("<AppHeader"));
check("Home includes School summary", home.includes('title: "School"'));
check("Home includes Calendar summary", home.includes('title: "Calendar"'));
check("Home includes Tasks summary", home.includes('title: "Tasks"'));
check("Home includes Finance summary", home.includes('title: "Finance"'));
check("Home includes Health summary", home.includes('title: "Health"'));
check("Home includes Garage summary", home.includes('title: "Garage"'));
check("Home includes Sports summary", home.includes('title: "Sports"'));
check("Home includes Projects summary", home.includes('title: "Projects"'));
check("Home includes Notes summary", home.includes('title: "Notes"'));
check("Home includes Media summary", home.includes('title: "Media"'));
check("Home cards use real routes", ["/school","/calendar","/tasks","/finance","/health","/garage","/sports","/projects","/notes","/media"].every((route) => home.includes('href: "' + route + '"')));
check("Responsive Home grid exists", home.includes("sm:grid-cols-2") && home.includes("md:grid-cols-3") && home.includes("lg:grid-cols-4"));
check("Milestone 1 tracker is active", progress.includes("Milestone 1") && progress.includes("Home"));

const failed = checks.filter(([, pass]) => !pass);
for (const [label, pass] of checks) console.log((pass ? "PASS" : "FAIL") + "  " + label);
console.log("\n" + (checks.length - failed.length) + "/" + checks.length + " Home structure checks passed.");
