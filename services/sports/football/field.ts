import type { FootballSituation, FootballTeamState } from "@/core/contracts/sports/Football";

export interface FootballFieldGeometry {
  lineOfScrimmage?: number;
  firstDownYardLine?: number;
  ballYardLine?: number;
  reliable: boolean;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

/**
 * Converts a provider's own/opponent yard line into one canonical offensive
 * coordinate: 0 is the offense's goal line and 100 is the opponent's.
 * A marker is withheld unless territory and possession identity agree.
 */
export function resolveFootballFieldGeometry(
  situation: FootballSituation | undefined,
  home: FootballTeamState | undefined,
  away: FootballTeamState | undefined,
): FootballFieldGeometry {
  const position = situation?.fieldPosition;
  const yardLine = position?.yardLine;
  if (yardLine === undefined || yardLine < 0 || yardLine > 50 || !position?.territory) {
    return { reliable: false };
  }

  const offense = situation?.possessionTeamId;
  const offenseTeam = offense && offense === home?.team.id ? home : offense && offense === away?.team.id ? away : undefined;
  const territory = position.territory.toLowerCase();
  const offenseAbbreviation = offenseTeam?.team.abbreviation?.toLowerCase();
  const defenseTeam = offenseTeam === home ? away : home;
  const defenseAbbreviation = defenseTeam?.team.abbreviation?.toLowerCase();
  if (!offenseAbbreviation || (territory !== offenseAbbreviation && territory !== defenseAbbreviation)) return { reliable: false };

  const lineOfScrimmage = clamp(territory === offenseAbbreviation ? yardLine : 100 - yardLine);
  const distance = situation?.distance;
  const firstDownYardLine = distance !== undefined && distance >= 0 ? clamp(lineOfScrimmage + distance) : undefined;
  return {
    lineOfScrimmage,
    firstDownYardLine,
    ballYardLine: lineOfScrimmage,
    reliable: true,
  };
}

export function parseFootballFieldPosition(display: string | undefined) {
  if (!display) return {};
  const match = display.trim().match(/^([A-Za-z0-9]+)\s+(\d{1,2})$/);
  if (!match) return {};
  const yardLine = Number(match[2]);
  return Number.isFinite(yardLine) ? { territory: match[1], yardLine } : {};
}
