import { readFile } from "node:fs/promises";

const season = Number(process.argv[2] ?? 2026);
const catalog = JSON.parse(await readFile(new URL("../services/sports/providers/mlb/uniformCatalog.json", import.meta.url), "utf8"));
const teamPayload = await (await fetch("https://statsapi.mlb.com/api/v1/teams?sportId=1&activeStatus=Y")).json();
const teams = teamPayload.teams ?? [];
const uniforms = await Promise.all(teams.map(async (team) => {
  const response = await fetch(`https://statsapi.mlb.com/api/v1/uniforms/team?teamIds=${team.id}&season=${season}`);
  const payload = await response.json();
  const assets = payload.uniforms?.[0]?.uniformAssets ?? [];
  return { team, jerseys: assets.filter((asset) => asset.active && asset.uniformAssetType?.uniformAssetTypeCode === "J") };
}));

let mapped = 0;
let unmapped = 0;
console.log(`MLB Uniform Coverage — ${season}\n`);
for (const { team, jerseys } of uniforms.sort((a, b) => a.team.name.localeCompare(b.team.name))) {
  console.log(team.name);
  for (const jersey of jerseys) {
    const known = catalog.season === season && catalog.teams[String(team.id)]?.some((number) => jersey.uniformAssetCode === `${team.id}_jersey_${number}_${season}`);
    console.log(`${known ? "✓" : "⚠ unmapped:"} ${jersey.uniformAssetCode} — ${jersey.uniformAssetText}`);
    known ? mapped++ : unmapped++;
  }
  console.log("");
}
console.log(`Summary: ${teams.length} teams, ${mapped + unmapped} active jersey assets, ${mapped} mapped, ${unmapped} unmapped`);
if (teams.length !== 30) console.warn(`Warning: expected 30 active MLB clubs, discovered ${teams.length}.`);
