import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:5173",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

type MlbResponse = {
  state?: string;
  live?: boolean;
  pregame?: boolean;

  lastGame?: {
    status: string;
    awayAbbr: string;
    awayScore: number;
    homeAbbr: string;
    homeScore: number;
    gameDate: string;
  } | null;

  nextGame?: {
    opponent: string;
    gameDate: string;
    isHome: boolean;
    awayAbbr: string;
    homeAbbr: string;
    awayScore: number | null;
    homeScore: number | null;
    status: string;

    liveDetails?: {
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
    } | null;
  } | null;
};

export async function GET(request: Request) {
  try {
    const origin =
      new URL(request.url).origin;

    const response = await fetch(
      `${origin}/api/sports/mlb`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(
        `MLB API returned ${response.status}`,
      );
    }

    const mlb =
      (await response.json()) as MlbResponse;

    const game = mlb.nextGame;

    if (!game) {
      return NextResponse.json(
        {
          game: null,
        },
        {
          headers: corsHeaders,
        },
      );
    }

    const base = {
      state: mlb.state ?? "scheduled",
      opponent: game.opponent,
      gameDate: game.gameDate,
      isHome: game.isHome,
      awayAbbr: game.awayAbbr,
      homeAbbr: game.homeAbbr,
      awayScore: game.awayScore,
      homeScore: game.homeScore,
      status: game.status,
    };

    if (
      mlb.state === "live" &&
      game.liveDetails
    ) {
      return NextResponse.json(
        {
          game: {
            ...base,

            live: {
              inning:
                game.liveDetails.inning,

              inningHalf:
                game.liveDetails.inningHalf,

              outs:
                game.liveDetails.outs,

              balls:
                game.liveDetails.balls,

              strikes:
                game.liveDetails.strikes,

              firstBase:
                game.liveDetails.firstBase,

              secondBase:
                game.liveDetails.secondBase,

              thirdBase:
                game.liveDetails.thirdBase,

              batter:
                game.liveDetails.batter,

              pitcher:
                game.liveDetails.pitcher,

              playDescription:
                game.liveDetails.playDescription,
            },
          },
        },
        {
          headers: corsHeaders,
        },
      );
    }

    return NextResponse.json(
      {
        game: base,
      },
      {
        headers: corsHeaders,
      },
    );
  } catch (error) {
    console.error(
      "Glasses Sports Error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to load Cosmic Glasses sports.",
      },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}