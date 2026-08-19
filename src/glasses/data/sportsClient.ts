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

  live?: {
    inning: number | null;
    inningHalf: string | null;
    outs: number;
    balls: number;
    strikes: number;
    firstBase: boolean;
    secondBase: boolean;
    thirdBase: boolean;
    batter: string | null;
    pitcher: string | null;
    playDescription: string | null;
  };
};

export type CosmicSportsResponse = {
  game: CosmicSportsGame | null;
};

const SPORTS_API =
  "http://localhost:3000/api/glasses/sports";

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