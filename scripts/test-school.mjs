import { readdir } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();

async function testFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await testFiles(absolute));
    else if (entry.isFile() && entry.name.endsWith(".test.ts")) files.push(absolute);
  }
  return files;
}

const files = (await Promise.all(["components/school", "services/school"].map((directory) => testFiles(path.join(root, directory))))).flat();
const child = spawn(process.execPath, ["--experimental-strip-types", "--experimental-loader", "./scripts/school-test-loader.mjs", "--test", ...files], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
