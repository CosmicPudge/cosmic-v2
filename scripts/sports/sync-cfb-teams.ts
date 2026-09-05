import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { getCollegeFootballDirectory } from "../../services/sports/providers/college-football-directory";

const ROOT = process.cwd();
const ASSET_DIR = join(ROOT, "public/sports/cfb/teams");
const MANIFEST = join(ROOT, "services/sports/identity/generated/cfbTeams.ts");
const MAX_BYTES = 512 * 1024;
const ALLOWED_HOST = "a.espncdn.com";

function safeAssetUrl(value: string | undefined) {
  if (!value) return undefined;
  const url = new URL(value);
  return url.protocol === "https:" && url.hostname === ALLOWED_HOST ? url : undefined;
}

async function main() {
  const teams = await getCollegeFootballDirectory();
  await mkdir(ASSET_DIR, { recursive: true });
  const manifest: Record<string, Record<string, unknown>> = {};
  let downloaded = 0; let missingLogo = 0; let totalBytes = 0;
  for (const team of teams) {
    const logoUrl = safeAssetUrl(team.logoUrl);
    const entry: Record<string, unknown> = { providerTeamId: team.providerId, displayName: team.name, active: team.active !== false, ...(team.uid ? { uid: team.uid } : {}), ...(team.slug ? { slug: team.slug } : {}), ...(team.shortName ? { shortDisplayName: team.shortName } : {}), ...(team.school ? { school: team.school } : {}), ...(team.nickname ? { nickname: team.nickname } : {}), ...(team.abbreviation ? { abbreviation: team.abbreviation } : {}), ...(team.color ? { color: team.color } : {}), ...(team.alternateColor ? { alternateColor: team.alternateColor } : {}), ...(team.conferenceId ? { conferenceId: team.conferenceId } : {}), ...(team.conferenceName ? { conferenceName: team.conferenceName } : {}), ...(team.subdivision ? { subdivision: team.subdivision } : {}), ...(team.logoUrl ? { logoUrl: team.logoUrl } : {}), ...(team.darkLogoUrl ? { darkLogoUrl: team.darkLogoUrl } : {}) };
    if (!logoUrl) { missingLogo += 1; manifest[team.providerId ?? team.id] = entry; continue; }
    const response = await fetch(logoUrl);
    const contentType = response.headers.get("content-type")?.split(";", 1)[0]?.toLowerCase();
    const body = Buffer.from(await response.arrayBuffer());
    if (!response.ok || !contentType?.startsWith("image/") || body.byteLength === 0 || body.byteLength > MAX_BYTES) { missingLogo += 1; manifest[team.providerId ?? team.id] = entry; continue; }
    const extension = contentType === "image/svg+xml" ? "svg" : "png";
    const relative = `/sports/cfb/teams/${team.providerId}.${extension}`;
    const file = join(ROOT, "public", relative);
    let same = false;
    try { same = Buffer.compare(await readFile(file), body) === 0; } catch { same = false; }
    if (!same) { await mkdir(dirname(file), { recursive: true }); await writeFile(file, body); downloaded += 1; }
    totalBytes += body.byteLength;
    manifest[team.providerId ?? team.id] = { ...entry, logoPath: relative };
  }
  const date = new Date().toISOString();
  const lines = Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)).map(([id, entry]) => `  ${JSON.stringify(id)}: ${JSON.stringify(entry)},`);
  const source = `/** GENERATED FILE. Source: ESPN College Football team catalog and approved ESPN CDN logos. Generated: ${date}. Command: npx tsx scripts/sports/sync-cfb-teams.ts */\nexport interface GeneratedCfbTeamIdentity { providerTeamId: string; uid?: string; slug?: string; abbreviation?: string; displayName: string; shortDisplayName?: string; school?: string; nickname?: string; color?: string; alternateColor?: string; logoUrl?: string; darkLogoUrl?: string; logoPath?: string; active: boolean; conferenceId?: string; conferenceName?: string; subdivision?: \"FBS\" | \"FCS\"; }\nexport const CFB_TEAM_IDENTITY: Record<string, GeneratedCfbTeamIdentity> = {\n${lines.join("\n")}\n};\n`;
  await mkdir(dirname(MANIFEST), { recursive: true }); await writeFile(MANIFEST, source);
  console.log(JSON.stringify({ source: "ESPN College Football team catalog", teams: teams.length, withLogo: teams.length - missingLogo, missingLogo, downloaded, totalBytes }, null, 2));
}

void main().catch((error) => { console.error(error instanceof Error ? error.message : "CFB sync failed"); process.exitCode = 1; });
