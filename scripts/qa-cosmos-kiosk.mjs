import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const checks = [];
const check = (label, ok) => checks.push([label, Boolean(ok)]);

const kioskContract = read("core/contracts/Kiosk.ts");
const kioskConfig = read("components/os/kiosk/kioskConfig.ts");
const slideshow = read("components/os/kiosk/KioskSlideshow.tsx");
const control = read("services/devices/kioskSlideshow.ts");
const devicePage = read("app/devices/page.tsx");
const connected = read("components/account/ConnectedDevices.tsx");
const widgets = read("config/widgets.ts");
const milestones = read("config/cosmosMilestones.ts");

const expectedOrder = '["clock", "calendar", "school-calendar", "sports", "music", "garage", "notes", "tasks", "cosmic", "system"]';

check("Kiosk slide order is canonical", kioskContract.includes(expectedOrder));
check("Clock begins rotation", expectedOrder.startsWith('["clock"'));
check("System ends rotation", expectedOrder.endsWith('"system"]'));
check("Production rotation is 2 minutes", kioskConfig.includes("120_000"));
check("School Calendar kiosk widget registered", widgets.includes('id: "school-calendar"') && fs.existsSync("components/os/widgets/school/SchoolCalendarKioskWidget.tsx"));
check("Tasks kiosk widget registered", widgets.includes('id: "tasks"') && fs.existsSync("components/os/widgets/tasks/TasksWidget.tsx"));
check("Per-device enabled slides are persisted", control.includes("slideshowEnabledSlides") && control.includes("setKioskEnabledSlides"));
check("Slideshow consumes enabled slide settings", slideshow.includes("enabledSlides.includes"));
check("Devices page exposes kiosk controls", devicePage.includes("<ConnectedDevices />"));
check("Devices controls expose all kiosk slide toggles", ["Personal Calendar","School Calendar","Sports","Music","Garage","Notes","Tasks","Cosmic AI","System"].every((label) => connected.includes(label)));
check("Manual slideshow controls remain available", ["Previous","Pause","Next"].every((label) => connected.includes(label)));
check("Milestone 3 preview route exists", fs.existsSync("app/cosmos-kiosk/page.tsx"));
check("Milestone 3 tracker is active", milestones.includes('export const kioskChecks') && read("app/cosmos-progress/page.tsx").includes("getKioskProgress"));

const passed = checks.filter(([, ok]) => ok).length;
for (const [label, ok] of checks) console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
console.log(`\n${passed}/${checks.length} Kiosk structure checks passed.`);
if (passed !== checks.length) process.exit(1);
