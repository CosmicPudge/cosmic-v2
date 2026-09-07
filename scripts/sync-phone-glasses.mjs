import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(new URL("..", import.meta.url).pathname);
const glassesRoot = join(homedir(), "Cosmic", "cosmic-glasses");
const glassesDist = join(glassesRoot, "dist");
const mountRoot = join(repoRoot, "public", "dev", "phone-glasses");

function fail(message) {
  console.error(`phone-glasses sync failed: ${message}`);
  process.exit(1);
}

if (!existsSync(glassesRoot)) fail(`Cosmic Glasses repository not found at ${glassesRoot}`);

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const build = spawnSync(npmCommand, ["run", "build"], {
  cwd: glassesRoot,
  env: {
    ...process.env,
    VITE_COSMIC_API_BASE: "/api/glasses",
    VITE_APP_BASE: "/dev/phone-glasses/",
  },
  stdio: "inherit",
});
if (build.error) fail(build.error.message);
if (build.status !== 0) fail(`Cosmic Glasses build exited with status ${build.status}`);
if (!existsSync(join(glassesDist, "index.html"))) fail(`build output is missing ${join(glassesDist, "index.html")}`);

const index = readFileSync(join(glassesDist, "index.html"), "utf8");
if (!index.includes("/dev/phone-glasses/assets/")) fail("build output does not use the mounted asset base path");
if (index.includes('src="/assets/') || index.includes('href="/assets/')) fail("build output contains a root /assets/ reference");

rmSync(mountRoot, { recursive: true, force: true });
mkdirSync(mountRoot, { recursive: true });
cpSync(glassesDist, mountRoot, { recursive: true });

const mountedIndex = join(mountRoot, "index.html");
const mountedAssets = join(mountRoot, "assets");
if (!existsSync(mountedIndex)) fail("mounted artifact is missing index.html");
if (!existsSync(mountedAssets) || readdirSync(mountedAssets).length === 0) fail("mounted artifact is missing assets");

console.log(`Synced Cosmic Glasses to ${mountRoot}`);
