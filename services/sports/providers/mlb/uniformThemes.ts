import type { BaseballUniform, BaseballUniformAsset } from "@/core/contracts/sports/Baseball";
import catalog from "./uniformCatalog.json";

export interface MlbUniformTheme {
  id: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
  mutedText: string;
  backgroundStart: string;
  backgroundEnd: string;
  panelTint: string;
  watermarkTint: string;
}

type UniformThemeMap = Record<string, Record<string, MlbUniformTheme>>;
type Palette = Pick<MlbUniformTheme, "primary" | "secondary" | "accent">;

const theme = (id: string, values: Omit<MlbUniformTheme, "id">): MlbUniformTheme => ({ id, ...values });

const palettes: Record<string, Palette> = {
  "108": { primary: "#BA0021", secondary: "#003263", accent: "#E5A823" }, "109": { primary: "#A71930", secondary: "#E3D4AD", accent: "#000000" }, "110": { primary: "#DF4601", secondary: "#000000", accent: "#F5F5F5" }, "111": { primary: "#BD3039", secondary: "#0C2340", accent: "#FFFFFF" },
  "112": { primary: "#0E3386", secondary: "#CC3433", accent: "#FFFFFF" }, "113": { primary: "#C6011F", secondary: "#000000", accent: "#FFFFFF" }, "114": { primary: "#00385D", secondary: "#E50022", accent: "#FFFFFF" }, "115": { primary: "#33006F", secondary: "#C4CED4", accent: "#FFFFFF" },
  "116": { primary: "#0C2340", secondary: "#FA4616", accent: "#FFFFFF" }, "117": { primary: "#002D62", secondary: "#EB6E1F", accent: "#F4911E" }, "118": { primary: "#004687", secondary: "#BD9B60", accent: "#FFFFFF" }, "119": { primary: "#005A9C", secondary: "#EF3E42", accent: "#FFFFFF" },
  "120": { primary: "#AB0003", secondary: "#14225A", accent: "#FFFFFF" }, "121": { primary: "#002D72", secondary: "#FF5910", accent: "#FFFFFF" }, "133": { primary: "#003831", secondary: "#EFB21E", accent: "#FFFFFF" }, "134": { primary: "#27251F", secondary: "#FDB827", accent: "#FFFFFF" },
  "135": { primary: "#2F241D", secondary: "#FFC425", accent: "#FFFFFF" }, "136": { primary: "#0C2C56", secondary: "#005C5C", accent: "#D4C36A" }, "137": { primary: "#FD5A1E", secondary: "#27251F", accent: "#FFFFFF" }, "138": { primary: "#C41E3A", secondary: "#0C2340", accent: "#FEDB00" },
  "139": { primary: "#092C5C", secondary: "#8FBCE6", accent: "#FFFFFF" }, "140": { primary: "#003278", secondary: "#C0111F", accent: "#FFFFFF" }, "141": { primary: "#134A8E", secondary: "#1D2D5C", accent: "#E8291C" }, "142": { primary: "#002B5C", secondary: "#D31145", accent: "#B9975B" },
  "143": { primary: "#E81828", secondary: "#002D72", accent: "#FFFFFF" }, "144": { primary: "#CE1141", secondary: "#13274F", accent: "#ECA154" }, "145": { primary: "#27251F", secondary: "#C4CED4", accent: "#FFFFFF" }, "146": { primary: "#00A3E0", secondary: "#EF3340", accent: "#000000" },
  "147": { primary: "#003087", secondary: "#E4002B", accent: "#FFFFFF" }, "158": { primary: "#12284B", secondary: "#FFC52F", accent: "#FFFFFF" },
};

function category(teamId: string, number: number) {
  if (number === 15) return "special";
  if (number === 5 || (teamId === "145" && number === 6)) return "city-connect";
  if (number === 1) return "home-white";
  if (number === 2) return "away-grey";
  return `alternate-${Math.max(1, number - 2)}`;
}

function generatedTheme(teamId: string, number: number): MlbUniformTheme {
  const palette = palettes[teamId];
  const kind = category(teamId, number);
  if (kind === "home-white") return theme(`mlb-${teamId}-home-white`, { primary: "#F1EBDD", secondary: palette.primary, accent: palette.secondary, text: "#17233D", mutedText: "#4B5563", backgroundStart: palette.primary, backgroundEnd: "#9F927F", panelTint: palette.primary, watermarkTint: "#F1EBDD" });
  if (kind === "away-grey") return theme(`mlb-${teamId}-away-grey`, { primary: "#AEB5C0", secondary: palette.primary, accent: palette.secondary, text: "#FFFFFF", mutedText: "#D1D5DB", backgroundStart: palette.primary, backgroundEnd: "#202735", panelTint: palette.primary, watermarkTint: "#AEB5C0" });
  if (kind === "city-connect") return theme(`mlb-${teamId}-city-connect`, { primary: palette.secondary, secondary: palette.primary, accent: palette.accent, text: "#FFFFFF", mutedText: "#D8DEE8", backgroundStart: palette.secondary, backgroundEnd: "#111827", panelTint: palette.accent, watermarkTint: palette.secondary });
  if (kind === "special") return theme(`mlb-${teamId}-special`, { primary: palette.secondary, secondary: palette.primary, accent: palette.accent, text: "#FFFFFF", mutedText: "#D8DEE8", backgroundStart: palette.secondary, backgroundEnd: "#171717", panelTint: palette.accent, watermarkTint: palette.secondary });
  return theme(`mlb-${teamId}-${kind}`, { primary: kind === "alternate-2" ? palette.secondary : palette.primary, secondary: palette.primary, accent: palette.accent, text: "#FFFFFF", mutedText: "#D8DEE8", backgroundStart: kind === "alternate-2" ? palette.secondary : palette.primary, backgroundEnd: "#111827", panelTint: palette.accent, watermarkTint: kind === "alternate-2" ? palette.secondary : palette.primary });
}

export const MLB_UNIFORM_THEMES: UniformThemeMap = Object.fromEntries(Object.entries(catalog.teams).map(([teamId, numbers]) => [teamId, Object.fromEntries((numbers as number[]).map((number) => [`${teamId}_jersey_${number}_${catalog.season}`, generatedTheme(teamId, number)]))]));

MLB_UNIFORM_THEMES["108"]["108_jersey_1_2026"] = theme("angels-home-white", { primary: "#F5F7FA", secondary: "#BA0021", accent: "#D7193F", text: "#FFFFFF", mutedText: "#E5E7EB", backgroundStart: "#8F1025", backgroundEnd: "#4A0E1B", panelTint: "#E5EAF0", watermarkTint: "#F5F7FA" });
MLB_UNIFORM_THEMES["108"]["108_jersey_5_2026"] = theme("angels-city-connect", { primary: "#D8C29D", secondary: "#17324D", accent: "#BA0021", text: "#FFFFFF", mutedText: "#E8DED0", backgroundStart: "#17324D", backgroundEnd: "#24152B", panelTint: "#D8C29D", watermarkTint: "#D8C29D" });
MLB_UNIFORM_THEMES["114"]["114_jersey_4_2026"] = theme("guardians-alt-2-blue", { primary: "#123B72", secondary: "#E50022", accent: "#FF334F", text: "#FFFFFF", mutedText: "#D7E3F5", backgroundStart: "#123B72", backgroundEnd: "#07172F", panelTint: "#E50022", watermarkTint: "#123B72" });

function jerseyAsset(uniform?: BaseballUniform): BaseballUniformAsset | undefined {
  return uniform?.assets.find((asset) => asset.typeCode === "J" && asset.active !== false);
}

export function resolveMlbUniformTheme(teamId: string | undefined, uniform?: BaseballUniform) {
  const code = jerseyAsset(uniform)?.code;
  return teamId && code ? MLB_UNIFORM_THEMES[teamId]?.[code] : undefined;
}
