import { SportsState } from "@/types/os/SportsState";

export interface LastGame {
    status: string;

    awayAbbr: string;
    awayScore: number;
    awayRecord: string;

    homeAbbr: string;
    homeScore: number;
    homeRecord: string;

    gameDate: string;
}

export interface LiveDetails {
  inning: number;
  inningHalf: string;

  outs: number;
  balls: number;
  strikes: number;

  firstBase: boolean;
  secondBase: boolean;
  thirdBase: boolean;

  batter: string;
  pitcher: string;

  pitcherPitchCount: number;

  playDescription: string;

  awayLineupSpot: number;
  homeLineupSpot: number;

  isReview: boolean;
  isCommercialBreak: boolean;

  inningState: string;

  commercialEndsAt: string | null;
  commercialLength: number;
}

export interface NextGame {
    opponent: string;

    gameDate: string;

    isHome: boolean;

    awayAbbr: string;
    homeAbbr: string;

    awayScore: number | null;
    homeScore: number | null;

    status: string;

    liveDetails: LiveDetails | null;
}

export interface SportsData {

    state: SportsState;

    lastUpdated: string;

    live: boolean;
    pregame: boolean;

    gameState: string;

    lastGame: LastGame | null;

    nextGame: NextGame | null;
}

export async function getSports(): Promise<SportsData> {
    const response = await fetch("/api/sports/mlb");

    if (!response.ok) {
        throw new Error("Failed to load sports.");
    }

    return response.json();
}