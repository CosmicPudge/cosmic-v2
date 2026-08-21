"use client";

import { useEffect, useMemo, useState } from "react";

type BaseballPlayer = {
  id?: string;
  name?: string;
};

type BaseballPitch = {
  id?: string;
  pitchNumber?: number;
  typeCode?: string;
  typeName?: string;
  description?: string;
  result?: string;
  velocityMph?: number;
  spinRateRpm?: number;
  zone?: number;
  horizontalBreakInches?: number;
  verticalBreakInches?: number;
  extensionFeet?: number;
  plateX?: number;
  plateZ?: number;
  isStrike?: boolean;
  isBall?: boolean;
  inPlay?: boolean;
};

type BaseballPlay = {
  id?: string;
  sequence?: number;
  inning?: number;
  inningHalf?: string;
  description?: string;
  shortDescription?: string;
  eventType?: string;
  batter?: BaseballPlayer;
  pitcher?: BaseballPlayer;
  rbi?: number;
  scoringPlay?: boolean;
  result?: string;
  pitch?: BaseballPitch;
};

type BaseballLiveData = {
  eventId: string;
  sport: "mlb";
  generatedAt: string;
  stale: boolean;

  sources?: {
    id?: string;
    name?: string;
    status?: string;
    fetchedAt?: string;
  }[];

  away: {
    team: {
      id?: string;
      name?: string;
      abbreviation?: string;
      logo?: string;
    };
    score?: number;
    hits?: number;
    errors?: number;
  };

  home: {
    team: {
      id?: string;
      name?: string;
      abbreviation?: string;
      logo?: string;
    };
    score?: number;
    hits?: number;
    errors?: number;
  };

  inning?: number;
  inningHalf?: string;

  count?: {
    balls?: number;
    strikes?: number;
    outs?: number;
  };

  bases?: {
    first?: {
      player?: BaseballPlayer;
    };
    second?: {
      player?: BaseballPlayer;
    };
    third?: {
      player?: BaseballPlayer;
    };
  };

  matchup?: {
    batter?: BaseballPlayer;
    pitcher?: BaseballPlayer;
    onDeck?: BaseballPlayer;
    inHole?: BaseballPlayer;
  };

  currentAtBat?: {
    batter?: BaseballPlayer;
    pitcher?: BaseballPlayer;

    count?: {
      balls?: number;
      strikes?: number;
      outs?: number;
    };

    description?: string;
    result?: string;
    pitches?: BaseballPitch[];
  };

  latestPitch?: BaseballPitch;
  latestPlay?: BaseballPlay;
  recentPlays?: BaseballPlay[];

  linescore?: {
    innings?: Array<{
      inning?: number;

      away?: {
        runs?: number;
        hits?: number;
        errors?: number;
      };

      home?: {
        runs?: number;
        hits?: number;
        errors?: number;
      };
    }>;

    away?: {
      runs?: number;
      hits?: number;
      errors?: number;
    };

    home?: {
      runs?: number;
      hits?: number;
      errors?: number;
    };
  };

  venue?: {
    name?: string;
    city?: string;
    state?: string;
    roof?: string;
    surface?: string;
  };

  weather?: {
    temperatureF?: number;
    condition?: string;
    wind?: string;
  };

  probablePitchers?: {
    away?: {
      player?: BaseballPlayer;
    };

    home?: {
      player?: BaseballPlayer;
    };
  };

  boxScore?: {
    away?: {
      players?: Array<{
        player?: BaseballPlayer;
        batting?: Record<string, unknown>;
        pitching?: Record<string, unknown>;
        fielding?: Record<string, unknown>;
      }>;
    };

    home?: {
      players?: Array<{
        player?: BaseballPlayer;
        batting?: Record<string, unknown>;
        pitching?: Record<string, unknown>;
        fielding?: Record<string, unknown>;
      }>;
    };
  };

  winProbability?: {
    home?: number;
    away?: number;

    lastChange?: {
      home?: number;
      away?: number;
    };

    history?: Array<{
      inning?: number;
      inningHalf?: string;
      description?: string;
      home?: number;
      away?: number;
      homeChange?: number;
    }>;
  };
};

const POLL_MS = 3000;
type TeamTheme = { primary: string; ink: string; glow: string };
const TEAM_THEMES: Record<string, TeamTheme> = {
  LAA: { primary: "#ba0021", ink: "#ffe4e8", glow: "rgba(186,0,33,.32)" },
  HOU: { primary: "#eb6e1f", ink: "#fff0e2", glow: "rgba(235,110,31,.3)" },
};
const NEUTRAL_THEME: TeamTheme = { primary: "#38bdf8", ink: "#dff7ff", glow: "rgba(56,189,248,.24)" };
function teamTheme(abbreviation?: string): TeamTheme { return TEAM_THEMES[abbreviation ?? ""] ?? NEUTRAL_THEME; }
function teamLogo(team: { abbreviation?: string; logo?: string }) { return team.logo ?? (team.abbreviation ? `/logos/mlb/${team.abbreviation}.svg` : undefined); }

function pct(value?: number) {
  if (value === undefined) {
    return "—";
  }

  return `${(value * 100).toFixed(1)}%`;
}

function statValue(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return String(value);
}

function teamNameParts(name: string) {
  const words = name.trim().split(/\s+/);
  return words.length > 1 ? { location: words.slice(0, -1).join(" "), nickname: words.at(-1) ?? name } : { location: "", nickname: name };
}

function isBaseballLiveData(
  value: unknown,
): value is BaseballLiveData {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const data =
    value as Partial<BaseballLiveData>;

  return Boolean(
    data.sport === "mlb" &&
      data.away &&
      data.home &&
      data.away.team &&
      data.home.team,
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

export default function MLBSportsLab({ initialGamePk }: { initialGamePk: string }) {
  const [gamePk] = useState(initialGamePk);
  const [data, setData] =
    useState<BaseballLiveData | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  async function load() {
    try {
      const response = await fetch(
        `/api/sports/dev/mlb-live?gamePk=${encodeURIComponent(gamePk)}`,
        {
          cache: "no-store",
        },
      );

      let json: unknown;

      try {
        json = await response.json();
      } catch {
        throw new Error(
          `Cosmic MLB API returned invalid JSON (HTTP ${response.status}).`,
        );
      }

      if (!response.ok) {
        throw new Error(
          getApiError(json) ??
            `Cosmic MLB API request failed with HTTP ${response.status}.`,
        );
      }

      if (!isBaseballLiveData(json)) {
        console.error(
          "[MLB Sports Lab] Invalid live payload:",
          json,
        );

        throw new Error(
          "Cosmic MLB API returned incomplete live data.",
        );
      }

      setData(json);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(
        "[MLB Sports Lab] Refresh failed:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unknown sports error",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();

    const timer =
      window.setInterval(() => {
        void load();
      }, POLL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [gamePk]);

  const awayPlayers =
    data?.boxScore?.away?.players ?? [];

  const homePlayers =
    data?.boxScore?.home?.players ?? [];

  const currentBatterStats =
    useMemo(() => {
      const batterId =
        data?.matchup?.batter?.id;

      if (!batterId) {
        return undefined;
      }

      return [
        ...awayPlayers,
        ...homePlayers,
      ].find(
        (entry) =>
          entry.player?.id === batterId,
      );
    }, [
      data?.matchup?.batter?.id,
      awayPlayers,
      homePlayers,
    ]);

  if (loading && !data) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#030511] text-white">
        <div className="text-white/60">
          Loading Cosmic Sports Lab...
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#030511] px-6 text-white">
        <div className="w-full max-w-xl rounded-[2rem] border border-red-400/20 bg-red-500/10 p-8 text-center backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.28em] text-red-200/50">
            Cosmic Sports Lab
          </p>

          <h1 className="mt-3 text-2xl font-light">
            MLB live data unavailable
          </h1>

          <p className="mt-4 text-sm leading-6 text-red-100/70">
            {error ??
              "The live provider returned no usable data."}
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

  const awayTheme = teamTheme(data.away.team.abbreviation);
  const homeTheme = teamTheme(data.home.team.abbreviation);
  const isFinal = data.inning === undefined && data.currentAtBat === undefined;

  return (
    <main
      className="min-h-screen text-white"
      style={{
        backgroundImage: `linear-gradient(90deg,${awayTheme.primary}f5 0%,${awayTheme.primary}d0 18%,${awayTheme.primary}78 34%,${awayTheme.primary}22 44%,#07090f 50%,${homeTheme.primary}22 56%,${homeTheme.primary}78 66%,${homeTheme.primary}d0 82%,${homeTheme.primary}f5 100%),radial-gradient(circle at 50% 40%,rgba(5,7,13,.92),transparent 62%)`,
        backgroundColor: "#07090f",
      }}
    >
      <div className="mx-auto max-w-[1600px] px-5 py-6 lg:px-8">
        <header className="mb-2 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/80">
              Cosmic <span className="text-white/35">/</span> MLB Sports Lab
            </p>

          </div>

          <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-white/55">
            <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-1 text-emerald-100">● Auto</span>
            <span className="rounded-full border border-white/15 bg-black/25 px-2 py-1">PK {gamePk}</span>
            <span className="hidden md:inline">Refresh {POLL_MS / 1000}s · {lastUpdated ? lastUpdated.toLocaleTimeString() : "—"}</span>
          </div>
        </header>

        {error && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <span>
              Latest refresh failed: {error}
            </span>

            <span className="text-xs text-amber-100/50">
              Showing last valid data
            </span>
          </div>
        )}

        <section
          className="mb-3 rounded-2xl border border-white/10 p-3 backdrop-blur-xl md:p-4"
          style={{
            background: `linear-gradient(90deg,${awayTheme.primary}88 0%,${awayTheme.primary}44 34%,rgba(5,7,13,.92) 49%,rgba(5,7,13,.92) 51%,${homeTheme.primary}44 66%,${homeTheme.primary}88 100%)`,
            boxShadow: `0 18px 60px rgba(0,0,0,.35),0 0 42px ${awayTheme.glow},0 0 42px ${homeTheme.glow}`,
          }}
        >
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  data.stale || error
                    ? "bg-amber-400"
                    : "bg-emerald-400"
                }`}
              />

              <span className="text-xs uppercase tracking-[0.25em] text-white/60">
                {data.stale || error
                  ? "Degraded"
                  : "Live"}
              </span>
            </div>

            <div className="text-xs text-white/40">
              {data.sources?.[0]?.name ??
                "Unknown source"}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_minmax(210px,260px)_1fr] md:items-center">
            <TeamScore
              name={
                data.away.team.name ??
                "Away"
              }
              abbreviation={
                data.away.team
                  .abbreviation
              }
              score={data.away.score}
              hits={data.away.hits}
              errors={data.away.errors}
              theme={awayTheme}
              logo={teamLogo(data.away.team)}
            />

            <div className="rounded-xl border border-white/10 bg-[#050910]/90 px-4 py-4 text-center shadow-2xl">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
                {data.inning !== undefined ? "LIVE" : "SCHEDULED"}
              </div>
              <div className="mt-2 text-sm uppercase tracking-[0.18em] text-white/75">
                {data.inning !== undefined ? `${formatInningHalf(data.inningHalf)} ${data.inning ?? "—"}` : "Today · Game time TBD"}
              </div>
              {data.inning !== undefined && <CountDots count={data.count} />}
              <div className="mt-3 border-t border-white/10 pt-3 text-xs text-white/55">
                <div>{data.venue?.name ?? "Venue unavailable"}</div>
                <div>{[data.venue?.city, data.venue?.state].filter(Boolean).join(", ") || "MLB"}</div>
              </div>
            </div>

            <TeamScore
              align="right"
              name={
                data.home.team.name ??
                "Home"
              }
              abbreviation={
                data.home.team
                  .abbreviation
              }
              score={data.home.score}
              hits={data.home.hits}
              errors={data.home.errors}
              theme={homeTheme}
              logo={teamLogo(data.home.team)}
            />
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-2">
          {!isFinal && <Card title="Base State">
            <BaseDiamond
              first={
                data.bases?.first?.player
                  ?.name
              }
              second={
                data.bases?.second?.player
                  ?.name
              }
              third={
                data.bases?.third?.player
                  ?.name
              }
              theme={data.inningHalf === "top" ? awayTheme : homeTheme}
            />
          </Card>}

          {!isFinal && <Card title="Current Matchup">
            <div className="grid gap-4 sm:grid-cols-2">
              <Info
                label="Batter"
                value={
                  data.matchup?.batter?.name
                }
              />

              <Info
                label="Pitcher"
                value={
                  data.matchup?.pitcher?.name
                }
              />

              <Info
                label="On Deck"
                value={
                  data.matchup?.onDeck?.name
                }
              />

              <Info
                label="In Hole"
                value={
                  data.matchup?.inHole?.name
                }
              />
            </div>

            {currentBatterStats?.batting && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="mb-3 text-xs uppercase tracking-[0.2em] text-white/40">
                  Batter Game Stats
                </p>

                <div className="grid grid-cols-3 gap-3 text-sm sm:grid-cols-6">
                  <MiniStat
                    label="AB"
                    value={
                      currentBatterStats
                        .batting.atBats
                    }
                  />

                  <MiniStat
                    label="H"
                    value={
                      currentBatterStats
                        .batting.hits
                    }
                  />

                  <MiniStat
                    label="R"
                    value={
                      currentBatterStats
                        .batting.runs
                    }
                  />

                  <MiniStat
                    label="RBI"
                    value={
                      currentBatterStats
                        .batting.rbi
                    }
                  />

                  <MiniStat
                    label="HR"
                    value={
                      currentBatterStats
                        .batting.homeRuns
                    }
                  />

                  <MiniStat
                    label="SO"
                    value={
                      currentBatterStats
                        .batting.strikeouts
                    }
                  />
                </div>
              </div>
            )}
          </Card>}

          <Card title="Latest Pitch">
            {data.latestPitch ? (
              <div>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className="text-2xl font-medium">
                      {data.latestPitch
                        .typeName ??
                        "Unknown Pitch"}
                    </div>

                    <div className="mt-1 text-white/45">
                      {data.latestPitch
                        .description ?? "—"}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-4xl font-light">
                      {data.latestPitch
                        .velocityMph ?? "—"}
                    </div>

                    <div className="text-xs uppercase tracking-[0.2em] text-white/35">
                      MPH
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <MiniStat
                    label="Spin"
                    value={
                      data.latestPitch
                        .spinRateRpm
                    }
                    suffix=" rpm"
                  />

                  <MiniStat
                    label="Zone"
                    value={
                      data.latestPitch.zone
                    }
                  />

                  <MiniStat
                    label="H Break"
                    value={
                      data.latestPitch
                        .horizontalBreakInches
                    }
                    suffix='"'
                  />

                  <MiniStat
                    label="V Break"
                    value={
                      data.latestPitch
                        .verticalBreakInches
                    }
                    suffix='"'
                  />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <MiniStat
                    label="Extension"
                    value={
                      data.latestPitch
                        .extensionFeet
                    }
                    suffix=" ft"
                  />

                  <MiniStat
                    label="Plate X"
                    value={
                      data.latestPitch.plateX
                    }
                  />

                  <MiniStat
                    label="Plate Z"
                    value={
                      data.latestPitch.plateZ
                    }
                  />
                </div>
              </div>
            ) : (
              <Empty text="No pitch available." />
            )}
          </Card>

          <Card title="Win Probability">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                  {data.away.team
                    .abbreviation ?? "Away"}
                </p>

                <p className="mt-2 text-3xl font-light">
                  {pct(
                    data.winProbability
                      ?.away,
                  )}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                  {data.home.team
                    .abbreviation ?? "Home"}
                </p>

                <p className="mt-2 text-3xl font-light">
                  {pct(
                    data.winProbability
                      ?.home,
                  )}
                </p>
              </div>
            </div>

            <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="transition-all duration-500"
                style={{
                  width: `${
                    (data.winProbability
                      ?.away ?? 0.5) *
                    100
                  }%`,
                  background: awayTheme.primary,
                }}
              />

              <div className="flex-1" style={{ background: homeTheme.primary }} />
            </div>

            <div className="mt-4 flex flex-wrap justify-between gap-3 text-sm text-white/45">
              <span>
                History points:{" "}
                {data.winProbability
                  ?.history?.length ?? 0}
              </span>

              <span>
                Last swing:{" "}
                {formatProbabilityChange(
                  data.winProbability
                    ?.lastChange?.home,
                )}{" "}
                home
              </span>
            </div>
          </Card>
        </div>

        <section className="mt-5">
          <Card title="Line Score">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-white/35">
                  <tr>
                    <th className="px-3 py-2 text-left">
                      Team
                    </th>

                    {data.linescore?.innings?.map(
                      (inning, index) => (
                        <th
                          key={
                            inning.inning ??
                            index
                          }
                          className="px-3 py-2 text-center"
                        >
                          {inning.inning ??
                            "—"}
                        </th>
                      ),
                    )}

                    <th className="px-3 py-2 text-center">
                      R
                    </th>

                    <th className="px-3 py-2 text-center">
                      H
                    </th>

                    <th className="px-3 py-2 text-center">
                      E
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <LineScoreRow
                    label={
                      data.away.team
                        .abbreviation ??
                      "AWAY"
                    }
                    innings={
                      data.linescore?.innings
                    }
                    side="away"
                    total={
                      data.linescore?.away
                    }
                  />

                  <LineScoreRow
                    label={
                      data.home.team
                        .abbreviation ??
                      "HOME"
                    }
                    innings={
                      data.linescore?.innings
                    }
                    side="home"
                    total={
                      data.linescore?.home
                    }
                  />
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <Card title="Recent Plays">
            <div className="space-y-3">
              {data.recentPlays?.length ? (
                [...data.recentPlays]
                  .reverse()
                  .map((play) => (
                    <div
                      key={
                        play.id ??
                        play.sequence
                      }
                      className="rounded-2xl border border-white/8 bg-black/20 p-4"
                    >
                      <div className="flex justify-between gap-4">
                        <div>
                          <div className="text-sm font-medium">
                            {play.shortDescription ??
                              play.result ??
                              "Play"}
                          </div>

                          {play.scoringPlay && (
                            <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-cyan-200/60">
                              Scoring play
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-white/35">
                          {formatInningHalf(
                            play.inningHalf,
                          )}{" "}
                          {play.inning ?? "—"}
                        </div>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-white/55">
                        {play.description ??
                          "No description"}
                      </p>

                      {play.pitch && (
                        <div className="mt-3 text-xs text-white/35">
                          {play.pitch
                            .typeName ?? "Pitch"}
                          {" • "}
                          {play.pitch
                            .velocityMph ??
                            "—"}{" "}
                          mph
                          {" • "}
                          {play.pitch
                            .description ??
                            "—"}
                        </div>
                      )}
                    </div>
                  ))
              ) : (
                <Empty text="No recent plays." />
              )}
            </div>
          </Card>

          <Card title="Game Information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Info
                label="Venue"
                value={data.venue?.name}
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
                label="Roof"
                value={data.venue?.roof}
              />

              <Info
                label="Surface"
                value={
                  data.venue?.surface
                }
              />

              <Info
                label="Weather"
                value={
                  data.weather?.condition
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

              <Info
                label="Wind"
                value={
                  data.weather?.wind
                }
              />

              <Info
                label="Away Starter"
                value={
                  data.probablePitchers
                    ?.away?.player?.name
                }
              />

              <Info
                label="Home Starter"
                value={
                  data.probablePitchers
                    ?.home?.player?.name
                }
              />

              <Info
                label="Provider"
                value={
                  data.sources?.[0]
                    ?.name
                }
              />

              <Info
                label="Provider Status"
                value={
                  data.sources?.[0]
                    ?.status
                }
              />

              <Info
                label="Generated"
                value={
                  data.generatedAt
                    ? new Date(
                        data.generatedAt,
                      ).toLocaleTimeString()
                    : undefined
                }
              />
            </div>
          </Card>
        </div>

        <section className="mt-5">
          <Card title="Current At-Bat">
            <div className="mb-5 grid gap-4 sm:grid-cols-3">
              <Info
                label="Batter"
                value={
                  data.currentAtBat
                    ?.batter?.name
                }
              />

              <Info
                label="Pitcher"
                value={
                  data.currentAtBat
                    ?.pitcher?.name
                }
              />

              <Info
                label="Result / Status"
                value={
                  data.currentAtBat
                    ?.result ??
                  data.currentAtBat
                    ?.description
                }
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {data.currentAtBat?.pitches
                ?.length ? (
                data.currentAtBat.pitches.map(
                  (pitch, index) => (
                    <div
                      key={
                        pitch.id ??
                        pitch.pitchNumber ??
                        index
                      }
                      className="rounded-2xl border border-white/8 bg-black/20 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/35">
                          Pitch{" "}
                          {pitch.pitchNumber ??
                            index + 1}
                        </span>

                        <span className="text-sm font-medium">
                          {pitch.velocityMph ??
                            "—"}{" "}
                          mph
                        </span>
                      </div>

                      <div className="mt-3 text-lg">
                        {pitch.typeName ??
                          "Unknown"}
                      </div>

                      <div className="mt-1 text-sm text-white/45">
                        {pitch.description ??
                          "—"}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/35">
                        <span>
                          Spin:{" "}
                          {pitch.spinRateRpm ??
                            "—"}
                        </span>

                        <span>
                          Zone:{" "}
                          {pitch.zone ?? "—"}
                        </span>

                        <span>
                          X:{" "}
                          {formatDecimal(
                            pitch.plateX,
                          )}
                        </span>

                        <span>
                          Z:{" "}
                          {formatDecimal(
                            pitch.plateZ,
                          )}
                        </span>
                      </div>
                    </div>
                  ),
                )
              ) : (
                <div className="md:col-span-2 xl:col-span-4">
                  <Empty text="No current pitch sequence." />
                </div>
              )}
            </div>
          </Card>
        </section>

        <section className="mt-5">
          <Card title="Live Box Score">
            <div className="grid gap-5 xl:grid-cols-2">
              <TeamBoxScore
                title={
                  data.away.team.name ??
                  "Away"
                }
                players={awayPlayers}
              />

              <TeamBoxScore
                title={
                  data.home.team.name ??
                  "Home"
                }
                players={homePlayers}
              />
            </div>
          </Card>
        </section>

        <section className="mt-5">
          <Card title="Raw Cosmic BaseballLiveData">
            <pre className="max-h-[700px] overflow-auto rounded-2xl bg-black/30 p-4 text-xs leading-5 text-white/55">
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
    <section className="rounded-xl border border-white/15 bg-[#050910]/80 p-4 backdrop-blur-xl">
      <h2 className="mb-4 border-b border-white/10 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
        {title}
      </h2>

      {children}
    </section>
  );
}

function TeamScore({
  name,
  abbreviation,
  score,
  hits,
  errors,
  align = "left",
  theme,
  logo,
}: {
  name: string;
  abbreviation?: string;
  score?: number;
  hits?: number;
  errors?: number;
  align?: "left" | "right";
  theme: TeamTheme;
  logo?: string;
}) {
  const nameParts = teamNameParts(name);
  return (
    <div
      style={{ color: theme.ink, textShadow: `0 0 24px ${theme.glow}` }}
      className={`flex items-center gap-4 ${align === "right" ? "flex-row-reverse text-right" : "text-left"}`}
    >
      <div className="grid h-20 w-20 shrink-0 place-items-center p-1 md:h-24 md:w-24" style={{ filter: `drop-shadow(0 0 20px ${theme.glow})` }}>
        {logo ? <img src={logo} alt="" className="h-full w-full object-contain" /> : <span className="text-2xl font-bold tracking-widest">{abbreviation ?? "—"}</span>}
      </div>
      <div className="min-w-0">
        {nameParts.location && <div className="whitespace-nowrap text-[11px] uppercase tracking-[0.16em]" style={{ color: `${theme.ink}cc` }}>{nameParts.location}</div>}
        <div className="whitespace-nowrap text-xl font-bold uppercase tracking-tight md:text-2xl" style={{ color: theme.ink }}>{nameParts.nickname}</div>
        <div className="mt-0.5 text-5xl font-semibold leading-none tracking-tight md:text-6xl" style={{ color: theme.ink }}>{score ?? 0}</div>
        <div className="mt-1 text-[10px]" style={{ color: `${theme.ink}b3` }}>H {hits ?? 0} • E {errors ?? 0}</div>
      </div>
    </div>
  );
}

function CountDots({ count }: { count?: BaseballLiveData["count"] }) {
  const dots = (active: number, total: number, color: string) => <span className="flex gap-1" aria-label={`${active} of ${total}`}>
    {Array.from({ length: total }, (_, index) => <i key={index} className="h-2 w-2 rounded-full" style={{ background: index < active ? color : "rgba(255,255,255,.18)" }} />)}
  </span>;
  return <div className="mt-3 flex flex-wrap justify-center gap-3 text-[10px] uppercase tracking-widest text-white/65">
    <span className="flex items-center gap-2">B {dots(count?.balls ?? 0, 3, "#86efac")}</span>
    <span className="flex items-center gap-2">S {dots(count?.strikes ?? 0, 2, "#fb7185")}</span>
    <span className="flex items-center gap-2">O {dots(count?.outs ?? 0, 3, "#f8fafc")}</span>
  </div>;
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | number;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.18em] text-white/30">
        {label}
      </div>

      <div className="mt-1 text-base text-white/75">
        {value ?? "—"}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: unknown;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
      <div className="text-[10px] uppercase tracking-[0.15em] text-white/30">
        {label}
      </div>

      <div className="mt-1 text-sm text-white/75">
        {statValue(value)}
        {value !== undefined &&
        value !== null
          ? suffix
          : ""}
      </div>
    </div>
  );
}

function BaseDiamond({
  first,
  second,
  third,
  theme,
}: {
  first?: string;
  second?: string;
  third?: string;
  theme: TeamTheme;
}) {
  const spot = (label: string, runner: string | undefined, className: string) => <div className={`absolute flex flex-col items-center ${className}`}><Base occupied={Boolean(runner)} theme={theme} /><span className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-white/75">{label}</span>{runner && <span className="mt-1 max-w-24 truncate text-[10px] text-white/65">{runner}</span>}</div>;
  return (
    <div className="flex min-h-[210px] items-center justify-center">
      <div className="relative h-[185px] w-[230px]">
        {spot("2B", second, "left-1/2 top-0 -translate-x-1/2")}
        {spot("3B", third, "bottom-0 left-0")}
        {spot("1B", first, "bottom-0 right-0")}
      </div>
    </div>
  );
}

function Base({
  occupied,
  theme,
}: {
  occupied: boolean;
  theme: TeamTheme;
}) {
  return (
    <div
      className={[
        "h-12 w-12 rotate-45 rounded-[4px] border",
        occupied
          ? "shadow-[0_0_25px_var(--base-glow)]"
          : "border-white/35 bg-white/[0.07] shadow-[inset_0_0_14px_rgba(255,255,255,.06),0_0_16px_rgba(255,255,255,.05)]",
      ].join(" ")}
      style={occupied ? { background: theme.primary, borderColor: theme.ink, "--base-glow": theme.glow } as React.CSSProperties : undefined}
    />
  );
}

function LineScoreRow({
  label,
  innings,
  side,
  total,
}: {
  label: string;

  innings?: Array<{
    inning?: number;

    away?: {
      runs?: number;
      hits?: number;
      errors?: number;
    };

    home?: {
      runs?: number;
      hits?: number;
      errors?: number;
    };
  }>;

  side: "away" | "home";

  total?: {
    runs?: number;
    hits?: number;
    errors?: number;
  };
}) {
  return (
    <tr className="border-t border-white/8">
      <td className="px-3 py-3 font-medium">
        {label}
      </td>

      {innings?.map(
        (inning, index) => (
          <td
            key={
              inning.inning ?? index
            }
            className="px-3 py-3 text-center text-white/65"
          >
            {inning[side]?.runs ??
              "—"}
          </td>
        ),
      )}

      <td className="px-3 py-3 text-center font-semibold">
        {total?.runs ?? 0}
      </td>

      <td className="px-3 py-3 text-center">
        {total?.hits ?? 0}
      </td>

      <td className="px-3 py-3 text-center">
        {total?.errors ?? 0}
      </td>
    </tr>
  );
}

function TeamBoxScore({
  title,
  players,
}: {
  title: string;

  players: Array<{
    player?: BaseballPlayer;
    batting?: Record<string, unknown>;
    pitching?: Record<string, unknown>;
    fielding?: Record<string, unknown>;
  }>;
}) {
  const playersWithStats =
    players.filter((entry) => {
      const batting =
        entry.batting ?? {};

      const pitching =
        entry.pitching ?? {};

      return (
        Object.keys(batting).length >
          0 ||
        Object.keys(pitching).length >
          0
      );
    });

  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
      <h3 className="mb-4 text-lg font-medium">
        {title}
      </h3>

      {playersWithStats.length ? (
        <div className="space-y-2">
          {playersWithStats.map(
            (entry, index) => {
              const batting =
                entry.batting ?? {};

              const pitching =
                entry.pitching ?? {};

              const hasBatting =
                Object.keys(
                  batting,
                ).length > 0;

              const hasPitching =
                Object.keys(
                  pitching,
                ).length > 0;

              return (
                <div
                  key={
                    entry.player?.id ??
                    `${entry.player?.name}-${index}`
                  }
                  className="rounded-xl border border-white/6 bg-white/[0.025] p-3"
                >
                  <div className="font-medium text-white/80">
                    {entry.player?.name ??
                      "Unknown Player"}
                  </div>

                  {hasBatting && (
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/40">
                      <span>
                        AB{" "}
                        {statValue(
                          batting.atBats,
                        )}
                      </span>

                      <span>
                        H{" "}
                        {statValue(
                          batting.hits,
                        )}
                      </span>

                      <span>
                        R{" "}
                        {statValue(
                          batting.runs,
                        )}
                      </span>

                      <span>
                        RBI{" "}
                        {statValue(
                          batting.rbi,
                        )}
                      </span>

                      <span>
                        HR{" "}
                        {statValue(
                          batting.homeRuns,
                        )}
                      </span>

                      <span>
                        BB{" "}
                        {statValue(
                          batting.walks,
                        )}
                      </span>

                      <span>
                        SO{" "}
                        {statValue(
                          batting.strikeouts,
                        )}
                      </span>
                    </div>
                  )}

                  {hasPitching && (
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-cyan-100/45">
                      <span>
                        IP{" "}
                        {statValue(
                          pitching.inningsPitched,
                        )}
                      </span>

                      <span>
                        H{" "}
                        {statValue(
                          pitching.hits,
                        )}
                      </span>

                      <span>
                        ER{" "}
                        {statValue(
                          pitching.earnedRuns,
                        )}
                      </span>

                      <span>
                        BB{" "}
                        {statValue(
                          pitching.walks,
                        )}
                      </span>

                      <span>
                        K{" "}
                        {statValue(
                          pitching.strikeouts,
                        )}
                      </span>

                      <span>
                        P{" "}
                        {statValue(
                          pitching.pitchesThrown,
                        )}
                      </span>
                    </div>
                  )}
                </div>
              );
            },
          )}
        </div>
      ) : (
        <Empty text="No player stats available." />
      )}
    </div>
  );
}

function formatInningHalf(
  value?: string,
) {
  if (!value) {
    return "—";
  }

  switch (value.toLowerCase()) {
    case "top":
      return "Top";

    case "bottom":
      return "Bottom";

    case "middle":
      return "Middle";

    case "end":
      return "End";

    default:
      return value;
  }
}

function formatProbabilityChange(
  value?: number,
) {
  if (value === undefined) {
    return "—";
  }

  const percent =
    value * 100;

  const sign =
    percent > 0 ? "+" : "";

  return `${sign}${percent.toFixed(
    1,
  )}%`;
}

function formatDecimal(
  value?: number,
) {
  if (value === undefined) {
    return "—";
  }

  return value.toFixed(2);
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
