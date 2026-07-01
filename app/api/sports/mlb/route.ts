export async function GET() {
  const abbreviation = (teamName: string) => {
    const teams: Record<string, string> = {
      "Arizona Diamondbacks": "ARI",
      "Atlanta Braves": "ATL",
      "Baltimore Orioles": "BAL",
      "Boston Red Sox": "BOS",
      "Chicago Cubs": "CHC",
      "Chicago White Sox": "CWS",
      "Cincinnati Reds": "CIN",
      "Cleveland Guardians": "CLE",
      "Colorado Rockies": "COL",
      "Detroit Tigers": "DET",
      "Houston Astros": "HOU",
      "Kansas City Royals": "KC",
      "Los Angeles Angels": "LAA",
      "Los Angeles Dodgers": "LAD",
      "Miami Marlins": "MIA",
      "Milwaukee Brewers": "MIL",
      "Minnesota Twins": "MIN",
      "New York Mets": "NYM",
      "New York Yankees": "NYY",
      "Athletics": "ATH",
      "Philadelphia Phillies": "PHI",
      "Pittsburgh Pirates": "PIT",
      "San Diego Padres": "SD",
      "San Francisco Giants": "SF",
      "Seattle Mariners": "SEA",
      "St. Louis Cardinals": "STL",
      "Tampa Bay Rays": "TB",
      "Texas Rangers": "TEX",
      "Toronto Blue Jays": "TOR",
      "Washington Nationals": "WSH",
    };

    return teams[teamName] || teamName;
  };

  const today = new Date();

  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(today.getDate() - 14);

  const twoWeeksAhead = new Date();
  twoWeeksAhead.setDate(today.getDate() + 14);

  const pastResponse = await fetch(
    `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=108&startDate=${twoWeeksAgo.toISOString().split("T")[0]
    }&endDate=${today.toISOString().split("T")[0]
    }&hydrate=team`
  );

  const futureResponse = await fetch(
    `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=108&startDate=${today.toISOString().split("T")[0]
    }&endDate=${twoWeeksAhead.toISOString().split("T")[0]
    }&hydrate=team`
  );

  const pastData = await pastResponse.json();
  const futureData = await futureResponse.json();

  const pastGames =
    pastData.dates?.flatMap(
      (date: any) => date.games
    ) || [];

  const futureGames =
    futureData.dates?.flatMap(
      (date: any) => date.games
    ) || [];
  const allGames = [
    ...pastGames,
    ...futureGames,
  ];

  const lastGame = [...pastGames]
    .filter(
      (g: any) =>
        g.status.abstractGameState === "Final"
    )
    .sort(
      (a: any, b: any) =>
        new Date(b.gameDate).getTime() -
        new Date(a.gameDate).getTime()
    )[0];

  const activeGame = [...allGames]
    .filter(
      (g: any) =>
        g.status.abstractGameState === "Live" ||
        g.status.abstractGameState === "Preview"
    )
    .sort(
      (a: any, b: any) =>
        new Date(a.gameDate).getTime() -
        new Date(b.gameDate).getTime()
    )[0];

  const nextScheduledGame = [...futureGames]
    .filter(
      (g: any) =>
        new Date(g.gameDate) > new Date()
    )
    .sort(
      (a: any, b: any) =>
        new Date(a.gameDate).getTime() -
        new Date(b.gameDate).getTime()
    )[0];

  const game =
    activeGame || nextScheduledGame;

  if (!lastGame && !game) {
    return Response.json({
      status: "No Game Scheduled",
    });
  }
  let liveGameData = null;
  const isLive =
    game?.status?.abstractGameState === "Live" ||
    game?.status?.detailedState?.includes("Progress") ||
    game?.status?.detailedState?.includes("Manager Challenge") ||
    game?.status?.detailedState?.includes("Review");

  if (game?.gamePk && isLive) {
    const liveResponse = await fetch(
      `https://statsapi.mlb.com/api/v1.1/game/${game.gamePk}/feed/live`,
      {
        cache: "no-store",
      }
    );

    liveGameData = await liveResponse.json();
  }
  console.log(
    futureGames.map((g: any) => ({
      state: g.status.abstractGameState,
      detailed: g.status.detailedState,
      date: g.gameDate,
      away: g.teams.away.team.name,
      home: g.teams.home.team.name,
    }))
  );

  const linescore =
    liveGameData?.liveData?.linescore;

  const offense =
    linescore?.offense;

  const currentPlay =
    liveGameData?.liveData?.plays?.currentPlay;
  console.log(
    JSON.stringify(
      currentPlay?.matchup,
      null,
      2
    )
  );
  const playDescription =
    currentPlay?.result?.description ?? null;

  const isReview =
    playDescription?.includes("challenge") ||
    playDescription?.includes("Challenge") ||
    playDescription?.includes("review") ||
    playDescription?.includes("Review");

  const inningState =
    linescore?.inningState ?? null;

  const isCommercialBreak =
    inningState === "Middle" ||
    inningState === "End";
  const COMMERCIAL_LENGTH = 125;

  const commercialEndsAt =
    isCommercialBreak
      ? Date.now() + COMMERCIAL_LENGTH * 1000
      : null;
  const inning =
    linescore?.currentInning ?? null;

  const inningHalf =
    linescore?.inningHalf ?? null;

  const outs =
    linescore?.outs ?? 0;

  const firstBase = !!offense?.first;
  const secondBase = !!offense?.second;
  const thirdBase = !!offense?.third;

  const balls =
    currentPlay?.count?.balls ?? 0;

  const strikes =
    currentPlay?.count?.strikes ?? 0;
  const batter =
    currentPlay?.matchup?.batter?.fullName ??
    null;
  const batterId =
    currentPlay?.matchup?.batter?.id;

  const awayBatters =
    liveGameData?.liveData?.boxscore?.teams?.away?.batters ?? [];

  const homeBatters =
    liveGameData?.liveData?.boxscore?.teams?.home?.batters ?? [];

  const awayLineupSpot =
    awayBatters.findIndex(
      (id: number) => id === batterId
    ) + 1;

  const homeLineupSpot =
    homeBatters.findIndex(
      (id: number) => id === batterId
    ) + 1;
  const pitcher =
    currentPlay?.matchup?.pitcher?.fullName ??
    null;
  const pitcherId =
    currentPlay?.matchup?.pitcher?.id;
  const pitcherPitchCount =
    liveGameData?.liveData?.boxscore
      ?.teams?.home?.players?.[
      `ID${pitcherId}`
    ]?.stats?.pitching
      ?.numberOfPitches ??

    liveGameData?.liveData?.boxscore
      ?.teams?.away?.players?.[
      `ID${pitcherId}`
    ]?.stats?.pitching
      ?.numberOfPitches ??

    0;

  const isPregame =
    game?.status?.abstractGameState === "Preview";

  let state:
    | "pregame"
    | "live"
    | "final"
    | "scheduled"
    | "offseason"
    | "postponed"
    | "delayed";

  if (isLive) {
    state = "live";
  } else if (isPregame) {
    state = "pregame";
  } else if (game?.status?.abstractGameState === "Final") {
    state = "final";
  } else if (
    game?.status?.detailedState === "Postponed"
  ) {
    state = "postponed";
  } else if (
    game?.status?.detailedState === "Delayed Start" ||
    game?.status?.detailedState === "Delayed"
  ) {
    state = "delayed";
  } else {
    state = "scheduled";
  }

  return Response.json({
    lastUpdated: new Date().toISOString(),

    state,

    live: isLive,

    pregame: isPregame,

    gameState:
      game?.status?.abstractGameState ??
      "Scheduled",

    // rest of your response...

    lastGame: lastGame
      ? {
        status:
          lastGame.status.detailedState,

        awayAbbr: abbreviation(
          lastGame.teams.away.team.name
        ),

        awayScore:
          lastGame.teams.away.score ?? 0,

        awayRecord: `${lastGame.teams.away.leagueRecord.wins}-${lastGame.teams.away.leagueRecord.losses}`,

        homeAbbr: abbreviation(
          lastGame.teams.home.team.name
        ),

        homeScore:
          lastGame.teams.home.score ?? 0,

        homeRecord: `${lastGame.teams.home.leagueRecord.wins}-${lastGame.teams.home.leagueRecord.losses}`,

        gameDate:
          lastGame.gameDate,
      }
      : null,

    nextGame: game
      ? {
        opponent:
          game.teams.away.team.name ===
            "Los Angeles Angels"
            ? game.teams.home.team.name
            : game.teams.away.team.name,

        gameDate: game.gameDate,

        isHome:
          game.teams.home.team.name ===
          "Los Angeles Angels",

        awayAbbr: abbreviation(
          game.teams.away.team.name
        ),

        homeAbbr: abbreviation(
          game.teams.home.team.name
        ),

        awayScore:
          game.teams.away.score ?? null,

        homeScore:
          game.teams.home.score ?? null,

        status:
          game.status.detailedState,

        liveDetails: isLive
          ? {
            inning,
            inningHalf,
            outs,
            balls,
            strikes,

            firstBase,
            secondBase,
            thirdBase,

            batter,
            awayLineupSpot,
            homeLineupSpot,

            pitcher,
            pitcherPitchCount,

            playDescription,
            isReview,
            isCommercialBreak,
            inningState,

            commercialEndsAt,
            commercialLength: COMMERCIAL_LENGTH,
          }
          : null,
      }
      : null,
  });
}