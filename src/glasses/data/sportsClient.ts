import { cosmicApi } from "./apiBase";

export type CosmicSportsGame = {
  state: string;
  opponent: string;
  gameDate: string;
  isHome: boolean;
  awayAbbr: string;
  homeAbbr: string;
  awayScore: number | null;
  homeScore: number | null;
  status: string;

  live?: CosmicSportsLive;
};

export type CosmicSportsLive = {
    inning: number | null;
    inningHalf: string | null;
    period?: string | number | null;
    outs: number | null;
    balls: number | null;
    strikes: number | null;
    firstBase: boolean | null;
    secondBase: boolean | null;
    thirdBase: boolean | null;
    batter: string | null;
    pitcher: string | null;
    playDescription: string | null;
};

export type CosmicSportsResponse = {
  game: CosmicSportsGame | null;
};

const SPORTS_API = cosmicApi("sports");

export async function getCosmicSports(): Promise<CosmicSportsResponse> {
  const response = await fetch(SPORTS_API, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Cosmic sports API returned ${response.status}`,
    );
  }

  return response.json();
}
