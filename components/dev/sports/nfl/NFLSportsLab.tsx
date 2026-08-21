"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type ProviderStatus =
  | "ok"
  | "degraded"
  | "unavailable";

type FootballTeamRef = {
  id?: string;
  name?: string;
  abbreviation?: string;
  logo?: string;
};

type FootballTeamState = {
  team: FootballTeamRef;
  score: number;
  record?: string;
  timeoutsRemaining?: number;
  possession?: boolean;
};

type FootballSituation = {
  quarter?: number;
  clock?: string;

  possession?:
    | "home"
    | "away"
    | "unknown";

  possessionTeamId?: string;
  possessionTeamAbbreviation?: string;

  down?: number;
  distance?: number;

  fieldPosition?: {
    territory?: string;
    yardLine?: number;
    display?: string;
    yardsToEndzone?: number;
  };

  downDistanceText?: string;
  shortDownDistanceText?: string;
  possessionText?: string;

  redZone?: boolean;
};

type FootballDriveSummary = {
  id?: string;
  teamId?: string;
  teamAbbreviation?: string;

  description?: string;
  result?: string;

  scoringDrive?: boolean;

  startPeriod?: number;
  endPeriod?: number;

  startClock?: string;
  endClock?: string;

  startFieldPosition?: string;
  endFieldPosition?: string;

  plays?: number;
  yards?: number;

  elapsedTime?: string;

  firstDowns?: number;
  offensiveTouchdowns?: number;
  fieldGoals?: number;
  turnovers?: number;
};

type FootballPlay = {
  id?: string;
  sequence?: number;

  period?: number;
  clock?: string;
  wallclock?: string;

  type?: string;

  description: string;
  shortDescription?: string;

  teamId?: string;
  teamAbbreviation?: string;

  down?: number;
  distance?: number;

  downDistanceText?: string;
  shortDownDistanceText?: string;

  possessionText?: string;

  yardLine?: number;
  yardsToEndzone?: number;

  yardsGained?: number;

  scoringPlay?: boolean;
  touchdown?: boolean;
  turnover?: boolean;
  penalty?: boolean;
  firstDown?: boolean;
  sack?: boolean;
  interception?: boolean;
  fumble?: boolean;

  homeScore?: number;
  awayScore?: number;

  possessionAfterPlayTeamId?: string;
};

type FootballScoringPlay = {
  id?: string;
  period?: number;
  clock?: string;

  teamId?: string;
  teamAbbreviation?: string;

  description: string;

  scoreAfter?: {
    home?: number;
    away?: number;
  };

  type?: string;
};

type FootballTeamStats = {
  firstDowns?: number;
  totalYards?: number;
  passingYards?: number;
  rushingYards?: number;

  turnovers?: number;
  fumblesLost?: number;
  interceptionsThrown?: number;

  penalties?: number;
  penaltyYards?: number;

  possessionTime?: string;

  thirdDownMade?: number;
  thirdDownAttempts?: number;

  fourthDownMade?: number;
  fourthDownAttempts?: number;

  sacksAllowed?: number;
  yardsPerPlay?: number;

  redZoneMade?: number;
  redZoneAttempts?: number;
};

type FootballTeamStatBlock = {
  teamId?: string;
  teamAbbreviation?: string;
  stats: FootballTeamStats;
};

type FootballPlayerStats = {
  playerId?: string;

  name: string;
  shortName?: string;

  teamId?: string;
  teamAbbreviation?: string;

  position?: string;
  jerseyNumber?: string;

  passing?: {
    completions?: number;
    attempts?: number;
    yards?: number;
    touchdowns?: number;
    interceptions?: number;
    sacks?: number;
    sackYards?: number;
    yardsPerAttempt?: number;
    passerRating?: number;
    long?: number;
  };

  rushing?: {
    attempts?: number;
    yards?: number;
    touchdowns?: number;
    yardsPerCarry?: number;
    longest?: number;
    fumbles?: number;
  };

  receiving?: {
    targets?: number;
    receptions?: number;
    yards?: number;
    touchdowns?: number;
    yardsPerReception?: number;
    longest?: number;
  };

  defense?: {
    totalTackles?: number;
    soloTackles?: number;
    sacks?: number;
    tacklesForLoss?: number;
    passesDefended?: number;
    interceptions?: number;
    forcedFumbles?: number;
    fumbleRecoveries?: number;
  };

  kicking?: {
    fieldGoalsMade?: number;
    fieldGoalsAttempted?: number;
    extraPointsMade?: number;
    extraPointsAttempted?: number;
    longestFieldGoal?: number;
    points?: number;
  };

  punting?: {
    punts?: number;
    yards?: number;
    average?: number;
    longest?: number;
    inside20?: number;
    touchbacks?: number;
  };

  returns?: {
    kickoffReturns?: number;
    kickoffReturnYards?: number;
    kickoffReturnTouchdowns?: number;

    puntReturns?: number;
    puntReturnYards?: number;
    puntReturnTouchdowns?: number;
  };
};

type FootballLiveData = {
  eventId: string;
  sport: "nfl";

  generatedAt: string;
  stale: boolean;

  sources?: Array<{
    id?: string;
    name?: string;
    status?: ProviderStatus;
    fetchedAt?: string;
    cacheSeconds?: number;

    capabilities?: {
      schedule?: boolean;
      liveScore?: boolean;
      liveState?: boolean;
      playByPlay?: boolean;
      stats?: boolean;
      weather?: boolean;
    };
  }>;

  game?: {
    status?: string;
    statusDetail?: string;
    date?: string;
    attendance?: number;
    season?: number;
    seasonType?: number;
  };

  away: FootballTeamState;
  home: FootballTeamState;

  situation: FootballSituation;

  currentDrive?: FootballDriveSummary;
  drives?: FootballDriveSummary[];

  latestPlay?: FootballPlay;
  recentPlays?: FootballPlay[];
  plays?: FootballPlay[];

  scoringPlays?: FootballScoringPlay[];

  teamStats?: FootballTeamStatBlock[];

  playerStats?: FootballPlayerStats[];

  venue?: {
    name?: string;
    city?: string;
    state?: string;
    indoor?: boolean;
    grass?: boolean;
    capacity?: number;
  };

  broadcast?: {
    network?: string;
    national?: boolean;
    streaming?: string[];
    radio?: string[];
  };

  weather?: {
    temperatureF?: number;
    condition?: string;
    humidityPercent?: number;
    windMph?: number;
    windDirection?: string;
  };

  winProbability?: {
    home?: number;
    away?: number;

    lastChange?: {
      home?: number;
      away?: number;
    };

    history?: Array<{
      playId?: string;
      sequence?: number;
      period?: number;
      clock?: string;
      description?: string;
      home?: number;
      away?: number;
      homeChange?: number;
    }>;
  };

  turnovers?: {
    home?: number;
    away?: number;
  };
};

const EVENT_ID = "401873275";
const POLL_MS = 3000;

type PlayerTab =
  | "passing"
  | "rushing"
  | "receiving"
  | "defense"
  | "kicking"
  | "punting";

function isFootballLiveData(
  value: unknown,
): value is FootballLiveData {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const data =
    value as Partial<FootballLiveData>;

  return Boolean(
    data.sport === "nfl" &&
      data.away &&
      data.home &&
      data.away.team &&
      data.home.team &&
      data.situation,
  );
}

function getApiError(
  value: unknown,
): string | undefined {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return undefined;
  }

  if (
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error;
  }

  if (
    "message" in value &&
    typeof value.message === "string"
  ) {
    return value.message;
  }

  return undefined;
}

function display(
  value: unknown,
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "—";
  }

  return String(value);
}

function formatPeriod(
  period?: number,
) {
  if (period === undefined) {
    return "—";
  }

  if (period <= 4) {
    return `Q${period}`;
  }

  return `OT${period - 4}`;
}

function formatBoolean(
  value?: boolean,
) {
  if (value === undefined) {
    return "—";
  }

  return value ? "Yes" : "No";
}

function formatDown(
  down?: number,
) {
  if (
    down === undefined ||
    down <= 0
  ) {
    return "—";
  }

  if (down === 1) return "1st";
  if (down === 2) return "2nd";
  if (down === 3) return "3rd";

  return `${down}th`;
}

function formatPercent(
  value?: number,
) {
  if (value === undefined) {
    return "—";
  }

  return `${(
    value * 100
  ).toFixed(1)}%`;
}

function isFinalGame(
  data: FootballLiveData,
) {
  const status =
    (
      data.game?.statusDetail ??
      data.game?.status ??
      ""
    ).toLowerCase();

  return status.includes("final");
}

export default function NFLSportsLab() {
  const [
    data,
    setData,
  ] =
    useState<FootballLiveData | null>(
      null,
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    lastUpdated,
    setLastUpdated,
  ] =
    useState<Date | null>(null);

  const [
    playerTab,
    setPlayerTab,
  ] =
    useState<PlayerTab>(
      "passing",
    );

  async function load() {
    try {
      const response =
        await fetch(
          `/api/sports/dev/nfl-live?eventId=${EVENT_ID}`,
          {
            cache: "no-store",
          },
        );

      let json: unknown;

      try {
        json =
          await response.json();
      } catch {
        throw new Error(
          `Cosmic NFL API returned invalid JSON (HTTP ${response.status}).`,
        );
      }

      if (!response.ok) {
        throw new Error(
          getApiError(json) ??
            `Cosmic NFL API request failed with HTTP ${response.status}.`,
        );
      }

      if (
        !isFootballLiveData(
          json,
        )
      ) {
        console.error(
          "[NFL Sports Lab] Invalid payload:",
          json,
        );

        throw new Error(
          "Cosmic NFL API returned incomplete live data.",
        );
      }

      setData(json);
      setError(null);
      setLastUpdated(
        new Date(),
      );
    } catch (err) {
      console.error(
        "[NFL Sports Lab] Refresh failed:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unknown NFL sports error",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();

    const timer =
      window.setInterval(
        () => {
          void load();
        },
        POLL_MS,
      );

    return () => {
      window.clearInterval(
        timer,
      );
    };
  }, []);

  const homeStats =
    useMemo(() => {
      if (!data) {
        return undefined;
      }

      return data.teamStats?.find(
        (entry) =>
          entry.teamId ===
          data.home.team.id,
      );
    }, [data]);

  const awayStats =
    useMemo(() => {
      if (!data) {
        return undefined;
      }

      return data.teamStats?.find(
        (entry) =>
          entry.teamId ===
          data.away.team.id,
      );
    }, [data]);

  const scoringDrives =
    useMemo(
      () =>
        data?.drives?.filter(
          (drive) =>
            drive.scoringDrive,
        ) ?? [],
      [data],
    );

  const visiblePlayers =
    useMemo(() => {
      const players =
        data?.playerStats ?? [];

      return players.filter(
        (player) =>
          Boolean(
            player[
              playerTab
            ],
          ),
      );
    }, [
      data,
      playerTab,
    ]);

  if (
    loading &&
    !data
  ) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#030511] text-white">
        <div className="text-white/60">
          Loading Cosmic NFL Sports Lab...
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#030511] px-6 text-white">
        <div className="w-full max-w-xl rounded-[2rem] border border-red-400/20 bg-red-500/10 p-8 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-red-200/50">
            Cosmic Sports Lab
          </p>

          <h1 className="mt-3 text-2xl font-light">
            NFL data unavailable
          </h1>

          <p className="mt-4 text-sm leading-6 text-red-100/70">
            {error ??
              "The NFL provider returned no usable data."}
          </p>

          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void load();
            }}
            className="mt-6 rounded-full border border-white/15 bg-white/10 px-5 py-2 text-sm transition hover:bg-white/15"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  const final =
    isFinalGame(data);

  const situation =
    data.situation;

  return (
    <main className="min-h-screen bg-[#030511] text-white">
      <div className="mx-auto max-w-[1600px] px-5 py-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-green-200/45">
              Cosmic Sports Lab
            </p>

            <h1 className="mt-2 text-3xl font-light tracking-tight">
              NFL Live Integration
            </h1>
          </div>

          <div className="text-right text-sm text-white/45">
            <div>
              Event: {EVENT_ID}
            </div>

            <div>
              Refresh:{" "}
              {POLL_MS / 1000}s
            </div>

            <div>
              Last refresh:{" "}
              {lastUpdated
                ? lastUpdated.toLocaleTimeString()
                : "—"}
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Latest refresh failed:{" "}
            {error}. Showing the last valid payload.
          </div>
        )}

        <section className="mb-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  final
                    ? "bg-white/50"
                    : data.stale ||
                        error
                      ? "bg-amber-400"
                      : "bg-emerald-400"
                }`}
              />

              <span className="text-xs uppercase tracking-[0.24em] text-white/55">
                {final
                  ? "Final"
                  : data.stale ||
                      error
                    ? "Degraded"
                    : "Live"}
              </span>
            </div>

            <div className="text-xs text-white/35">
              {data.game
                ?.statusDetail ??
                data.game
                  ?.status ??
                "Unknown status"}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <TeamScore
              team={
                data.away.team
              }
              score={
                data.away.score
              }
              record={
                data.away.record
              }
              possession={
                data.away
                  .possession
              }
            />

            <div className="text-center">
              <div className="text-sm uppercase tracking-[0.22em] text-green-200/55">
                {final
                  ? "FINAL"
                  : `${formatPeriod(
                      situation.quarter,
                    )} • ${
                      situation.clock ??
                      "—"
                    }`}
              </div>

              {!final &&
                situation.downDistanceText && (
                  <div className="mt-2 text-sm text-white/55">
                    {
                      situation.downDistanceText
                    }
                  </div>
                )}
            </div>

            <TeamScore
              team={
                data.home.team
              }
              score={
                data.home.score
              }
              record={
                data.home.record
              }
              possession={
                data.home
                  .possession
              }
              align="right"
            />
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-3">
          <Card title="Game Situation">
            {final ? (
              <div className="py-10 text-center">
                <div className="text-3xl font-light">
                  Final
                </div>

                <div className="mt-2 text-sm text-white/40">
                  Live down-and-distance state is no longer active.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Info
                  label="Quarter"
                  value={formatPeriod(
                    situation.quarter,
                  )}
                />

                <Info
                  label="Clock"
                  value={
                    situation.clock
                  }
                />

                <Info
                  label="Possession"
                  value={
                    situation.possessionTeamAbbreviation ??
                    situation.possession
                  }
                />

                <Info
                  label="Down"
                  value={formatDown(
                    situation.down,
                  )}
                />

                <Info
                  label="Distance"
                  value={
                    situation.distance
                  }
                />

                <Info
                  label="Field Position"
                  value={
                    situation.possessionText ??
                    situation
                      .fieldPosition
                      ?.display
                  }
                />

                <Info
                  label="Yards to End Zone"
                  value={
                    situation
                      .fieldPosition
                      ?.yardsToEndzone
                  }
                />

                <Info
                  label="Red Zone"
                  value={formatBoolean(
                    situation.redZone,
                  )}
                />
              </div>
            )}
          </Card>

          <Card title="Current Drive">
            {data.currentDrive ? (
              <div>
                <div className="text-2xl font-light">
                  {data.currentDrive
                    .result ??
                    "Drive"}
                </div>

                <p className="mt-2 text-sm leading-6 text-white/50">
                  {data.currentDrive
                    .description ??
                    "No drive description"}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <MiniStat
                    label="Plays"
                    value={
                      data.currentDrive
                        .plays
                    }
                  />

                  <MiniStat
                    label="Yards"
                    value={
                      data.currentDrive
                        .yards
                    }
                  />

                  <MiniStat
                    label="Time"
                    value={
                      data.currentDrive
                        .elapsedTime
                    }
                  />

                  <MiniStat
                    label="Start"
                    value={
                      data.currentDrive
                        .startClock
                    }
                  />
                </div>
              </div>
            ) : (
              <Empty text="No current drive available." />
            )}
          </Card>

          <Card title="Game Information">
            <div className="grid grid-cols-2 gap-4">
              <Info
                label="Status"
                value={
                  data.game
                    ?.statusDetail
                }
              />

              <Info
                label="Attendance"
                value={
                  data.game
                    ?.attendance
                }
              />

              <Info
                label="Venue"
                value={
                  data.venue?.name
                }
              />

              <Info
                label="Location"
                value={[
                  data.venue?.city,
                  data.venue?.state,
                ]
                  .filter(Boolean)
                  .join(", ")}
              />

              <Info
                label="Network"
                value={
                  data.broadcast
                    ?.network
                }
              />

              <Info
                label="Indoor"
                value={formatBoolean(
                  data.venue
                    ?.indoor,
                )}
              />

              <Info
                label="Surface"
                value={
                  data.venue
                    ?.grass ===
                  undefined
                    ? undefined
                    : data.venue
                          .grass
                      ? "Grass"
                      : "Artificial"
                }
              />

              <Info
                label="Temperature"
                value={
                  data.weather
                    ?.temperatureF !==
                  undefined
                    ? `${data.weather.temperatureF}°F`
                    : undefined
                }
              />
            </div>
          </Card>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <Card title="Latest Play">
            {data.latestPlay ? (
              <PlayCard
                play={
                  data.latestPlay
                }
                expanded
              />
            ) : (
              <Empty text="No latest play available." />
            )}
          </Card>

          <Card title="Turnovers">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-white/30">
                  {data.away.team
                    .abbreviation ??
                    "Away"}
                </div>

                <div className="mt-2 text-4xl font-light">
                  {display(
                    data.turnovers
                      ?.away,
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs uppercase tracking-[0.18em] text-white/30">
                  {data.home.team
                    .abbreviation ??
                    "Home"}
                </div>

                <div className="mt-2 text-4xl font-light">
                  {display(
                    data.turnovers
                      ?.home,
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <section className="mt-5">
          <Card title="Team Stats">
            <TeamStatsComparison
              awayName={
                data.away.team
                  .abbreviation ??
                "Away"
              }
              homeName={
                data.home.team
                  .abbreviation ??
                "Home"
              }
              away={
                awayStats?.stats
              }
              home={
                homeStats?.stats
              }
            />
          </Card>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <Card title="Scoring Drives">
            {scoringDrives.length ? (
              <div className="space-y-3">
                {scoringDrives.map(
                  (
                    drive,
                    index,
                  ) => (
                    <DriveCard
                      key={
                        drive.id ??
                        index
                      }
                      drive={
                        drive
                      }
                    />
                  ),
                )}
              </div>
            ) : (
              <Empty text="No scoring drives available." />
            )}
          </Card>

          <Card title="Recent Plays">
            {data.recentPlays
              ?.length ? (
              <div className="space-y-3">
                {[
                  ...data.recentPlays,
                ]
                  .reverse()
                  .map(
                    (
                      play,
                      index,
                    ) => (
                      <PlayCard
                        key={
                          play.id ??
                          index
                        }
                        play={
                          play
                        }
                      />
                    ),
                  )}
              </div>
            ) : (
              <Empty text="No recent plays available." />
            )}
          </Card>
        </div>

        <section className="mt-5">
          <Card title="Drive History">
            {data.drives?.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {data.drives.map(
                  (
                    drive,
                    index,
                  ) => (
                    <DriveCard
                      key={
                        drive.id ??
                        index
                      }
                      drive={
                        drive
                      }
                    />
                  ),
                )}
              </div>
            ) : (
              <Empty text="No drive history available." />
            )}
          </Card>
        </section>

        <section className="mt-5">
          <Card title="Player Stats">
            <div className="mb-5 flex flex-wrap gap-2">
              {(
                [
                  "passing",
                  "rushing",
                  "receiving",
                  "defense",
                  "kicking",
                  "punting",
                ] as PlayerTab[]
              ).map(
                (tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() =>
                      setPlayerTab(
                        tab,
                      )
                    }
                    className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.14em] transition ${
                      playerTab ===
                      tab
                        ? "border-green-300/40 bg-green-300/10 text-green-100"
                        : "border-white/10 bg-white/[0.03] text-white/40 hover:bg-white/[0.06]"
                    }`}
                  >
                    {tab}
                  </button>
                ),
              )}
            </div>

            {visiblePlayers.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {visiblePlayers.map(
                  (
                    player,
                    index,
                  ) => (
                    <PlayerStatCard
                      key={
                        player.playerId ??
                        `${player.name}-${index}`
                      }
                      player={
                        player
                      }
                      tab={
                        playerTab
                      }
                    />
                  ),
                )}
              </div>
            ) : (
              <Empty
                text={`No ${playerTab} stats available.`}
              />
            )}
          </Card>
        </section>

        <section className="mt-5">
          <Card title="Provider Health">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.sources?.map(
                (
                  source,
                  index,
                ) => (
                  <div
                    key={
                      source.id ??
                      index
                    }
                    className="rounded-2xl border border-white/8 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-white/75">
                        {source.name ??
                          source.id ??
                          "Provider"}
                      </div>

                      <ProviderBadge
                        status={
                          source.status
                        }
                      />
                    </div>

                    <div className="mt-3 text-xs text-white/35">
                      Cache target:{" "}
                      {source.cacheSeconds ??
                        "—"}
                      s
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Capability
                        label="Score"
                        active={
                          source
                            .capabilities
                            ?.liveScore
                        }
                      />

                      <Capability
                        label="State"
                        active={
                          source
                            .capabilities
                            ?.liveState
                        }
                      />

                      <Capability
                        label="PBP"
                        active={
                          source
                            .capabilities
                            ?.playByPlay
                        }
                      />

                      <Capability
                        label="Stats"
                        active={
                          source
                            .capabilities
                            ?.stats
                        }
                      />

                      <Capability
                        label="Weather"
                        active={
                          source
                            .capabilities
                            ?.weather
                        }
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          </Card>
        </section>

        <section className="mt-5">
          <Card title="Full Play-by-Play">
            {data.plays?.length ? (
              <div className="max-h-[900px] space-y-3 overflow-y-auto pr-1">
                {[...data.plays]
                  .reverse()
                  .map(
                    (
                      play,
                      index,
                    ) => (
                      <PlayCard
                        key={
                          play.id ??
                          index
                        }
                        play={
                          play
                        }
                      />
                    ),
                  )}
              </div>
            ) : (
              <Empty text="No play-by-play available." />
            )}
          </Card>
        </section>

        <section className="mt-5">
          <Card title="Raw Cosmic FootballLiveData">
            <pre className="max-h-[800px] overflow-auto rounded-2xl bg-black/30 p-4 text-xs leading-5 text-white/50">
              {JSON.stringify(
                data,
                null,
                2,
              )}
            </pre>
          </Card>
        </section>
      </div>
    </main>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <h2 className="mb-5 text-xs font-medium uppercase tracking-[0.24em] text-green-200/50">
        {title}
      </h2>

      {children}
    </section>
  );
}

function TeamScore({
  team,
  score,
  record,
  possession,
  align = "left",
}: {
  team: FootballTeamRef;
  score: number;
  record?: string;
  possession?: boolean;
  align?: "left" | "right";
}) {
  return (
    <div
      className={
        align === "right"
          ? "text-right"
          : "text-left"
      }
    >
      <div className="flex items-center gap-2">
        {align ===
          "right" && (
          <div className="flex-1" />
        )}

        {possession && (
          <span className="h-2 w-2 rounded-full bg-green-300" />
        )}

        <span className="text-xs uppercase tracking-[0.2em] text-white/35">
          {team.abbreviation ??
            ""}
        </span>
      </div>

      <div className="mt-1 text-lg text-white/70">
        {team.name ??
          "Unknown Team"}
      </div>

      <div className="mt-1 text-5xl font-light tracking-tight">
        {score}
      </div>

      {record && (
        <div className="mt-2 text-xs text-white/35">
          {record}
        </div>
      )}
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: unknown;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/30">
        {label}
      </div>

      <div className="mt-1 text-base text-white/75">
        {display(value)}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value?: unknown;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-white/30">
        {label}
      </div>

      <div className="mt-1 text-sm text-white/75">
        {display(value)}
      </div>
    </div>
  );
}

function PlayCard({
  play,
  expanded = false,
}: {
  play: FootballPlay;
  expanded?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        play.scoringPlay
          ? "border-green-300/20 bg-green-300/[0.06]"
          : play.turnover
            ? "border-red-300/20 bg-red-300/[0.06]"
            : play.penalty
              ? "border-amber-300/15 bg-amber-300/[0.04]"
              : "border-white/8 bg-black/20"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-white/80">
              {play.shortDescription ??
                play.type ??
                "Play"}
            </span>

            {play.scoringPlay && (
              <Tag text="Score" />
            )}

            {play.turnover && (
              <Tag text="Turnover" />
            )}

            {play.penalty && (
              <Tag text="Penalty" />
            )}

            {play.sack && (
              <Tag text="Sack" />
            )}
          </div>

          <div className="mt-1 text-xs text-white/35">
            {formatPeriod(
              play.period,
            )}
            {" • "}
            {play.clock ??
              "—"}

            {play.downDistanceText
              ? ` • ${play.downDistanceText}`
              : ""}
          </div>
        </div>

        {play.yardsGained !==
          undefined && (
          <div className="text-right">
            <div className="text-lg font-light">
              {play.yardsGained >
              0
                ? "+"
                : ""}
              {play.yardsGained}
            </div>

            <div className="text-[10px] uppercase tracking-[0.15em] text-white/25">
              Yards
            </div>
          </div>
        )}
      </div>

      <p
        className={`mt-3 text-sm leading-6 text-white/55 ${
          expanded
            ? ""
            : "line-clamp-4"
        }`}
      >
        {play.description}
      </p>

      {(play.homeScore !==
        undefined ||
        play.awayScore !==
          undefined) && (
        <div className="mt-3 text-xs text-white/30">
          Score after play:{" "}
          {play.awayScore ??
            "—"}{" "}
          -{" "}
          {play.homeScore ??
            "—"}
        </div>
      )}
    </div>
  );
}

function DriveCard({
  drive,
}: {
  drive: FootballDriveSummary;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        drive.scoringDrive
          ? "border-green-300/20 bg-green-300/[0.05]"
          : "border-white/8 bg-black/20"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-white/80">
            {drive.teamAbbreviation
              ? `${drive.teamAbbreviation} • `
              : ""}
            {drive.result ??
              "Drive"}
          </div>

          <div className="mt-1 text-xs text-white/35">
            {drive.startPeriod
              ? formatPeriod(
                  drive.startPeriod,
                )
              : "—"}
            {" • "}
            {drive.startClock ??
              "—"}
          </div>
        </div>

        {drive.scoringDrive && (
          <Tag text="Score" />
        )}
      </div>

      <p className="mt-3 text-sm text-white/50">
        {drive.description ??
          "No drive description"}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MiniStat
          label="Plays"
          value={drive.plays}
        />

        <MiniStat
          label="Yards"
          value={drive.yards}
        />

        <MiniStat
          label="Time"
          value={
            drive.elapsedTime
          }
        />
      </div>
    </div>
  );
}

function TeamStatsComparison({
  awayName,
  homeName,
  away,
  home,
}: {
  awayName: string;
  homeName: string;
  away?: FootballTeamStats;
  home?: FootballTeamStats;
}) {
  const rows: Array<{
    label: string;
    away: unknown;
    home: unknown;
  }> = [
    {
      label: "Total Yards",
      away:
        away?.totalYards,
      home:
        home?.totalYards,
    },
    {
      label:
        "Passing Yards",
      away:
        away?.passingYards,
      home:
        home?.passingYards,
    },
    {
      label:
        "Rushing Yards",
      away:
        away?.rushingYards,
      home:
        home?.rushingYards,
    },
    {
      label:
        "First Downs",
      away:
        away?.firstDowns,
      home:
        home?.firstDowns,
    },
    {
      label:
        "Turnovers",
      away:
        away?.turnovers,
      home:
        home?.turnovers,
    },
    {
      label:
        "Possession",
      away:
        away?.possessionTime,
      home:
        home?.possessionTime,
    },
    {
      label:
        "Penalties",
      away:
        away?.penalties !==
        undefined
          ? `${away.penalties}-${away.penaltyYards ?? "—"}`
          : undefined,
      home:
        home?.penalties !==
        undefined
          ? `${home.penalties}-${home.penaltyYards ?? "—"}`
          : undefined,
    },
    {
      label:
        "3rd Down",
      away:
        away?.thirdDownMade !==
          undefined
          ? `${away.thirdDownMade}/${away.thirdDownAttempts ?? "—"}`
          : undefined,
      home:
        home?.thirdDownMade !==
          undefined
          ? `${home.thirdDownMade}/${home.thirdDownAttempts ?? "—"}`
          : undefined,
    },
    {
      label:
        "4th Down",
      away:
        away?.fourthDownMade !==
          undefined
          ? `${away.fourthDownMade}/${away.fourthDownAttempts ?? "—"}`
          : undefined,
      home:
        home?.fourthDownMade !==
          undefined
          ? `${home.fourthDownMade}/${home.fourthDownAttempts ?? "—"}`
          : undefined,
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-[1fr_1.3fr_1fr] border-b border-white/8 pb-3 text-xs uppercase tracking-[0.16em] text-white/30">
        <div>
          {awayName}
        </div>

        <div className="text-center">
          Stat
        </div>

        <div className="text-right">
          {homeName}
        </div>
      </div>

      {rows.map(
        (row) => (
          <div
            key={
              row.label
            }
            className="grid grid-cols-[1fr_1.3fr_1fr] border-b border-white/6 py-3 text-sm"
          >
            <div className="text-white/70">
              {display(
                row.away,
              )}
            </div>

            <div className="text-center text-white/35">
              {row.label}
            </div>

            <div className="text-right text-white/70">
              {display(
                row.home,
              )}
            </div>
          </div>
        ),
      )}
    </div>
  );
}

function PlayerStatCard({
  player,
  tab,
}: {
  player: FootballPlayerStats;
  tab: PlayerTab;
}) {
  const stats =
    player[tab];

  if (!stats) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium text-white/80">
            {player.name}
          </div>

          <div className="mt-1 text-xs text-white/35">
            {player.teamAbbreviation ??
              "—"}

            {player.position
              ? ` • ${player.position}`
              : ""}

            {player.jerseyNumber
              ? ` • #${player.jerseyNumber}`
              : ""}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {Object.entries(
          stats,
        ).map(
          ([
            key,
            value,
          ]) => (
            <MiniStat
              key={key}
              label={humanize(
                key,
              )}
              value={value}
            />
          ),
        )}
      </div>
    </div>
  );
}

function ProviderBadge({
  status,
}: {
  status?: ProviderStatus;
}) {
  const styles =
    status === "ok"
      ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
      : status ===
          "degraded"
        ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
        : "border-red-300/20 bg-red-300/10 text-red-100";

  return (
    <span
      className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.16em] ${styles}`}
    >
      {status ??
        "unknown"}
    </span>
  );
}

function Capability({
  label,
  active,
}: {
  label: string;
  active?: boolean;
}) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] ${
        active
          ? "border-white/10 bg-white/[0.06] text-white/55"
          : "border-white/5 bg-transparent text-white/20"
      }`}
    >
      {label}
    </span>
  );
}

function Tag({
  text,
}: {
  text: string;
}) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-white/45">
      {text}
    </span>
  );
}

function humanize(
  value: string,
) {
  return value
    .replace(
      /([A-Z])/g,
      " $1",
    )
    .replace(
      /^./,
      (char) =>
        char.toUpperCase(),
    );
}

function Empty({
  text,
}: {
  text: string;
}) {
  return (
    <div className="py-8 text-center text-sm text-white/35">
      {text}
    </div>
  );
}