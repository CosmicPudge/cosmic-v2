import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = process.cwd();
const extensions = [".ts", ".tsx", ".js", ".mjs"];

function resolveLocal(base) {
  const candidates = [base, ...extensions.map((extension) => `${base}${extension}`)];
  if (fs.existsSync(base) && fs.statSync(base).isDirectory()) {
    candidates.push(...extensions.map((extension) => path.join(base, `index${extension}`)));
  }
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? null;
}

export async function resolve(specifier, context, nextResolve) {
  let base;
  if (specifier.startsWith("@/")) base = path.join(root, specifier.slice(2));
  else if (specifier.startsWith(".")) base = fileURLToPath(new URL(specifier, context.parentURL));

  if (base) {
    const resolved = resolveLocal(base);
    if (resolved) return { shortCircuit: true, url: pathToFileURL(resolved).href };
  }
  return nextResolve(specifier, context);
}
