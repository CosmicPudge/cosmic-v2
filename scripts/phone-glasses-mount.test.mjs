import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const mount = join(root, "public", "dev", "phone-glasses");
const indexPath = join(mount, "index.html");
const index = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : "";

test("mounted phone-glasses artifact exists and uses its namespaced base", () => {
  assert.ok(existsSync(indexPath), "run npm run sync:phone-glasses first");
  assert.match(index, /\/dev\/phone-glasses\/assets\//);
  assert.doesNotMatch(index, /(?:src|href)="\/assets\//);
  assert.ok(readdirSync(join(mount, "assets")).length > 0);
});

test("mounted artifact contains no local development endpoints or secrets", () => {
  const files = [indexPath, ...readdirSync(join(mount, "assets")).map((name) => join(mount, "assets", name))];
  const content = files.map((file) => readFileSync(file, "utf8")).join("\n");
  for (const forbidden of ["localhost", "127.0.0.1", "144.39.", "COSMIC_HTTPS_KEY", "/tmp/"]) {
    assert.equal(content.includes(forbidden), false, `found forbidden string: ${forbidden}`);
  }
});

test("route and security integration remain isolated", () => {
  const nextConfig = readFileSync(join(root, "next.config.ts"), "utf8");
  const proxy = readFileSync(join(root, "proxy.ts"), "utf8");
  assert.match(nextConfig, /source: "\/dev\/phone-glasses"/);
  assert.match(nextConfig, /camera=\(self\), microphone=\(\), geolocation=\(self\)/);
  assert.match(proxy, /pathname === "\/dev\/phone-glasses"/);
  assert.match(proxy, /"\/dev\/phone-glasses\/:path\*"/);
  assert.match(proxy, /getCurrentCosmicAccount\(request\)/);
});
