import type {
  FootballGameStats,
  FootballLiveData,
  FootballPlayerLeader,
  FootballPlayerStats,
  FootballTeamStatBlock,
} from "@/core/contracts/sports/Football";
import type { CollegeFootballLiveData } from "@/services/sports/providers/college-football-detail";

type FootballStatsSource = FootballLiveData | CollegeFootballLiveData;

function statLine(player: FootballPlayerStats, category: FootballPlayerLeader["category"]): string | undefined {
  if (category === "passing" && player.passing?.completions !== undefined && player.passing.attempts !== undefined && player.passing.yards !== undefined) {
    return `${player.passing.completions}/${player.passing.attempts} · ${player.passing.yards} YDS${player.passing.touchdowns !== undefined ? ` · ${player.passing.touchdowns} TD` : ""}`;
  }
  if (category === "rushing" && player.rushing?.attempts !== undefined && player.rushing.yards !== undefined) {
    return `${player.rushing.attempts} CAR · ${player.rushing.yards} YDS${player.rushing.touchdowns !== undefined ? ` · ${player.rushing.touchdowns} TD` : ""}`;
  }
  if (category === "receiving" && player.receiving?.receptions !== undefined && player.receiving.yards !== undefined) {
    return `${player.receiving.receptions} REC · ${player.receiving.yards} YDS${player.receiving.touchdowns !== undefined ? ` · ${player.receiving.touchdowns} TD` : ""}`;
  }
  return undefined;
}

function playerLeaders(players: FootballPlayerStats[] | undefined): FootballPlayerLeader[] {
  if (!players?.length) return [];
  return (['passing', 'rushing', 'receiving'] as const).flatMap((category) => {
    const player = players.find((candidate) => statLine(candidate, category));
    const line = player ? statLine(player, category) : undefined;
    return player && line ? [{ category, name: player.name, ...(player.playerId ? { playerId: player.playerId } : {}), ...(player.teamId ? { teamId: player.teamId } : {}), ...(player.teamAbbreviation ? { teamAbbreviation: player.teamAbbreviation } : {}), statLine: line }] : [];
  });
}

function cfbLeaders(source: CollegeFootballLiveData): FootballPlayerLeader[] {
  return (source.leaders ?? []).flatMap((leader) => {
    const category = leader.category.toLowerCase();
    const normalized = category.includes("pass") ? "passing" : category.includes("rush") ? "rushing" : category.includes("receiv") ? "receiving" : undefined;
    return normalized && leader.value ? [{ category: normalized, name: leader.name, statLine: leader.value }] : [];
  });
}

export function footballGameStats(source?: FootballStatsSource): FootballGameStats | undefined {
  if (!source) return undefined;
  const nfl = "playerStats" in source ? source : undefined;
  const cfb = "leaders" in source ? source : undefined;
  const teamStats: FootballTeamStatBlock[] | undefined = nfl?.teamStats ?? cfb?.teamStats;
  const playerLeaders = nfl ? playerLeadersFromNfl(nfl.playerStats) : cfb ? cfbLeaders(cfb) : [];
  const recentDrives = source.drives?.slice(-4).reverse() ?? (source.currentDrive ? [source.currentDrive] : []);
  const scoringPlays = nfl?.scoringPlays ?? cfb?.scoringPlayDetails;
  const scoringByPeriod = nfl?.scoringByPeriod ?? cfb?.scoringByPeriod;
  const redZone = teamStats?.filter((entry) => entry.stats.redZoneMade !== undefined || entry.stats.redZoneAttempts !== undefined);
  const stats: FootballGameStats = {
    ...(teamStats?.length ? { teamStats } : {}),
    ...(playerLeaders.length ? { playerLeaders } : {}),
    ...(recentDrives.length ? { recentDrives } : {}),
    ...(scoringPlays?.length ? { scoringPlays } : {}),
    ...(scoringByPeriod?.length ? { scoringByPeriod } : {}),
    ...(nfl?.winProbability ? { winProbability: nfl.winProbability } : {}),
    ...(redZone?.length ? { redZone } : {}),
    ...(source.stale ? { stale: true } : {}),
  };
  return Object.keys(stats).length ? stats : undefined;
}

function playerLeadersFromNfl(players?: FootballPlayerStats[]) {
  return playerLeaders(players);
}

export function footballStatRows(stats?: FootballTeamStatBlock[]) {
  if (!stats?.length) return [];
  const definitions = [
    ["Total Yards", (value: FootballTeamStatBlock) => value.stats.totalYards],
    ["Passing", (value: FootballTeamStatBlock) => value.stats.passingYards],
    ["Rushing", (value: FootballTeamStatBlock) => value.stats.rushingYards],
    ["First Downs", (value: FootballTeamStatBlock) => value.stats.firstDowns],
    ["Turnovers", (value: FootballTeamStatBlock) => value.stats.turnovers],
    ["3rd Down", (value: FootballTeamStatBlock) => value.stats.thirdDownMade !== undefined && value.stats.thirdDownAttempts !== undefined ? `${value.stats.thirdDownMade}/${value.stats.thirdDownAttempts}` : undefined],
    ["4th Down", (value: FootballTeamStatBlock) => value.stats.fourthDownMade !== undefined && value.stats.fourthDownAttempts !== undefined ? `${value.stats.fourthDownMade}/${value.stats.fourthDownAttempts}` : undefined],
    ["Penalties", (value: FootballTeamStatBlock) => value.stats.penalties !== undefined ? `${value.stats.penalties}${value.stats.penaltyYards !== undefined ? ` · ${value.stats.penaltyYards} YDS` : ""}` : undefined],
    ["Possession", (value: FootballTeamStatBlock) => value.stats.possessionTime],
  ] as const;
  return definitions.flatMap(([label, get]) => {
    const values = stats.map((entry) => get(entry));
    return values.some((value) => value !== undefined) ? [{ label, values }] : [];
  });
}
