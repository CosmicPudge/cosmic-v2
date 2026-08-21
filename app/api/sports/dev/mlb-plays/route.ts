import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const gamePk =
    request.nextUrl.searchParams.get("gamePk");

  if (!gamePk) {
    return NextResponse.json(
      {
        error: "Missing gamePk",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const response = await fetch(
      `https://statsapi.mlb.com/api/v1/game/${encodeURIComponent(
        gamePk,
      )}/winProbability`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "MLB Stats API request failed",
          status: response.status,
          statusText: response.statusText,
        },
        {
          status: 502,
        },
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[mlb-plays]", error);

    return NextResponse.json(
      {
        error: "Failed to fetch MLB play data",
        message:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      {
        status: 500,
      },
    );
  }
}