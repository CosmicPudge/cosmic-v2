import type { BaseballUniform } from "@/core/contracts/sports/Baseball";
import { resolveMlbUniformTheme } from "./uniformThemes";

export interface MlbTeamTheme {
  teamId: string;
  abbreviation: string;
  logo: string;
  primary: string;
  secondary: string;
  accent: string;
  textOnPrimary: string;
}

const themes: MlbTeamTheme[] = ([
  [108, "LAA", "#BA0021", "#003263", "#E5A823", "#FFFFFF"], [109, "ARI", "#A71930", "#E3D4AD", "#000000", "#FFFFFF"],
  [110, "BAL", "#DF4601", "#000000", "#F5F5F5", "#FFFFFF"], [111, "BOS", "#BD3039", "#0C2340", "#FFFFFF", "#FFFFFF"],
  [112, "CHC", "#0E3386", "#CC3433", "#FFFFFF", "#FFFFFF"], [113, "CIN", "#C6011F", "#000000", "#FFFFFF", "#FFFFFF"],
  [114, "CLE", "#00385D", "#E50022", "#FFFFFF", "#FFFFFF"], [115, "COL", "#33006F", "#C4CED4", "#FFFFFF", "#FFFFFF"],
  [116, "DET", "#0C2340", "#FA4616", "#FFFFFF", "#FFFFFF"], [117, "HOU", "#002D62", "#EB6E1F", "#F4911E", "#FFFFFF"],
  [118, "KC", "#004687", "#BD9B60", "#FFFFFF", "#FFFFFF"], [119, "LAD", "#005A9C", "#EF3E42", "#FFFFFF", "#FFFFFF"],
  [120, "WSH", "#AB0003", "#14225A", "#FFFFFF", "#FFFFFF"], [121, "NYM", "#002D72", "#FF5910", "#FFFFFF", "#FFFFFF"],
  [133, "OAK", "#003831", "#EFB21E", "#FFFFFF", "#FFFFFF"], [134, "PIT", "#27251F", "#FDB827", "#FFFFFF", "#FFFFFF"],
  [135, "SD", "#2F241D", "#FFC425", "#FFFFFF", "#FFFFFF"], [136, "SEA", "#0C2C56", "#005C5C", "#D4C36A", "#FFFFFF"],
  [137, "SF", "#FD5A1E", "#27251F", "#FFFFFF", "#FFFFFF"], [138, "STL", "#C41E3A", "#0C2340", "#FEDB00", "#FFFFFF"],
  [139, "TB", "#092C5C", "#8FBCE6", "#FFFFFF", "#FFFFFF"], [140, "TEX", "#003278", "#C0111F", "#FFFFFF", "#FFFFFF"],
  [141, "TOR", "#134A8E", "#1D2D5C", "#E8291C", "#FFFFFF"], [142, "MIN", "#002B5C", "#D31145", "#B9975B", "#FFFFFF"],
  [143, "PHI", "#E81828", "#002D72", "#FFFFFF", "#FFFFFF"], [144, "ATL", "#CE1141", "#13274F", "#ECA154", "#FFFFFF"],
  [145, "CWS", "#27251F", "#C4CED4", "#FFFFFF", "#FFFFFF"], [146, "MIA", "#00A3E0", "#EF3340", "#000000", "#FFFFFF"],
  [147, "NYY", "#003087", "#E4002B", "#FFFFFF", "#FFFFFF"], [158, "MIL", "#12284B", "#FFC52F", "#FFFFFF", "#FFFFFF"],
] as [number, string, string, string, string, string][]).map(([teamId, abbreviation, primary, secondary, accent, textOnPrimary]) => ({ teamId: String(teamId), abbreviation, logo: `/logos/mlb/${abbreviation}.svg`, primary, secondary, accent, textOnPrimary }));

const byId = new Map(themes.map((theme) => [theme.teamId, theme]));
const byAbbreviation = new Map(themes.map((theme) => [theme.abbreviation, theme]));
const fallback: MlbTeamTheme = { teamId: "unknown", abbreviation: "MLB", logo: "", primary: "#17233D", secondary: "#273A60", accent: "#8AE7FF", textOnPrimary: "#FFFFFF" };

export function getMlbTeamTheme(team?: { id?: string; abbreviation?: string }): MlbTeamTheme {
  return (team?.id ? byId.get(team.id) : undefined) ?? (team?.abbreviation ? byAbbreviation.get(team.abbreviation.toUpperCase()) : undefined) ?? fallback;
}

/** Resolve a real uniform mapping before the standard team palette. */
export function resolveMlbGameTeamTheme(team: { id?: string; abbreviation?: string }, uniform?: BaseballUniform) {
  const base = getMlbTeamTheme(team);
  const uniformTheme = resolveMlbUniformTheme(team.id ?? uniform?.teamId, uniform);
  return uniformTheme ? { ...base, ...uniformTheme } : base;
}

export { themes as MLB_TEAM_THEMES };
