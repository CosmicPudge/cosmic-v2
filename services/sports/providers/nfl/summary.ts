import type {
  FootballBroadcastInfo,
  FootballGameInfo,
  FootballPlayerStats,
  FootballScoringPlay,
  FootballTeamStatBlock,
  FootballTeamState,
  FootballVenueInfo,
  FootballWeatherInfo,
} from "@/core/contracts/sports/Football";

const ESPN_NFL_BASE =
  "https://site.api.espn.com/apis/site/v2/sports/football/nfl";

export interface NFLNormalizedSummary {
  eventId: string;

  home: FootballTeamState;

  away: FootballTeamState;

  game?: FootballGameInfo;

  venue?: FootballVenueInfo;

  broadcast?: FootballBroadcastInfo;

  weather?: FootballWeatherInfo;

  teamStats?: FootballTeamStatBlock[];

  playerStats?: FootballPlayerStats[];

  scoringPlays?: FootballScoringPlay[];

  raw: unknown;
}

function numberOrUndefined(
  value: unknown,
): number | undefined {
  if (typeof value === "number") {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim() !== ""
  ) {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function stringOrUndefined(
  value: unknown,
): string | undefined {
  return typeof value === "string"
    ? value
    : undefined;
}

function parseStatNumber(
  value: unknown,
): number | undefined {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const cleaned =
    value.replace(/,/g, "").trim();

  const parsed =
    Number.parseFloat(cleaned);

  return Number.isFinite(parsed)
    ? parsed
    : undefined;
}

function parseFraction(
  value: unknown,
): {
  made?: number;
  attempts?: number;
} {
  if (typeof value !== "string") {
    return {};
  }

  const [made, attempts] =
    value.split("-");

  return {
    made: parseStatNumber(made),
    attempts:
      parseStatNumber(attempts),
  };
}

function parsePenaltyStat(
  value: unknown,
): {
  penalties?: number;
  yards?: number;
} {
  if (typeof value !== "string") {
    return {};
  }

  const [penalties, yards] =
    value.split("-");

  return {
    penalties:
      parseStatNumber(penalties),

    yards:
      parseStatNumber(yards),
  };
}

function parseRecord(
  raw: any,
): string | undefined {
  if (!Array.isArray(raw)) {
    return undefined;
  }

  const overall =
    raw.find(
      (record: any) =>
        record?.type === "total" ||
        record?.name === "overall",
    ) ?? raw[0];

  return (
    stringOrUndefined(
      overall?.displayValue,
    ) ??
    stringOrUndefined(
      overall?.summary,
    )
  );
}

function getCompetitors(
  header: any,
) {
  const competition =
    header?.competitions?.[0];

  return Array.isArray(
    competition?.competitors,
  )
    ? competition.competitors
    : [];
}

function normalizeTeamState(
  competitor: any,
): FootballTeamState {
  const team =
    competitor?.team ?? {};

  return {
    team: {
      id:
        team.id !== undefined
          ? String(team.id)
          : undefined,

      name:
        team.displayName ??
        team.name ??
        team.shortDisplayName ??
        "Unknown Team",

      abbreviation:
        stringOrUndefined(
          team.abbreviation,
        ),

      logo:
        stringOrUndefined(
          team.logo,
        ),
    },

    score:
      numberOrUndefined(
        competitor?.score,
      ) ?? 0,

    record:
      parseRecord(
        competitor?.records,
      ),

    possession:
      competitor?.possession === true,
  };
}

function findHomeAway(
  competitors: any[],
) {
  const home =
    competitors.find(
      (competitor: any) =>
        competitor?.homeAway ===
        "home",
    );

  const away =
    competitors.find(
      (competitor: any) =>
        competitor?.homeAway ===
        "away",
    );

  return {
    home,
    away,
  };
}

function normalizeGameInfo(
  raw: any,
  header: any,
): FootballGameInfo | undefined {
  const competition =
    header?.competitions?.[0];

  const status =
    competition?.status ??
    header?.status;

  if (
    !competition &&
    !status &&
    !raw
  ) {
    return undefined;
  }

  return {
    status:
      stringOrUndefined(
        status?.type?.name,
      ),

    statusDetail:
      stringOrUndefined(
        status?.type?.detail,
      ) ??
      stringOrUndefined(
        status?.type?.description,
      ),

    date:
      stringOrUndefined(
        competition?.date ??
          header?.date,
      ),

    attendance:
      numberOrUndefined(
        raw?.attendance,
      ),

    season:
      numberOrUndefined(
        header?.season?.year,
      ),

    seasonType:
      numberOrUndefined(
        header?.season?.type,
      ),
  };
}

function normalizeVenue(
  raw: any,
  header: any,
): FootballVenueInfo | undefined {
  const competition =
    header?.competitions?.[0];

  const venue =
    raw?.venue ??
    competition?.venue;

  if (!venue) {
    return undefined;
  }

  const address =
    venue.address ?? {};

  const grass =
    typeof venue.grass ===
    "boolean"
      ? venue.grass
      : undefined;

  const indoor =
    typeof venue.indoor ===
    "boolean"
      ? venue.indoor
      : undefined;

  return {
    name:
      stringOrUndefined(
        venue.fullName,
      ) ??
      stringOrUndefined(
        venue.name,
      ),

    city:
      stringOrUndefined(
        address.city,
      ),

    state:
      stringOrUndefined(
        address.state,
      ),

    indoor,

    grass,

    capacity:
      numberOrUndefined(
        venue.capacity,
      ),
  };
}

function normalizeBroadcast(
  raw: any,
  header: any,
): FootballBroadcastInfo | undefined {
  const competition =
    header?.competitions?.[0];

  const broadcasts =
    Array.isArray(
      competition?.broadcasts,
    )
      ? competition.broadcasts
      : [];

  const networks = broadcasts
    .flatMap(
      (broadcast: any) =>
        Array.isArray(
          broadcast?.names,
        )
          ? broadcast.names
          : [],
    )
    .filter(
      (
        network: unknown,
      ): network is string =>
        typeof network ===
        "string",
    );

  const gameInfoBroadcast =
    raw?.broadcasts;

  if (
    networks.length === 0 &&
    !gameInfoBroadcast
  ) {
    return undefined;
  }

  return {
    network:
      networks[0] ??
      stringOrUndefined(
        gameInfoBroadcast?.[0]
          ?.name,
      ),

    national:
      broadcasts.some(
        (broadcast: any) =>
          broadcast?.market ===
          "national",
      ),

    streaming:
      networks.length > 1
        ? networks.slice(1)
        : undefined,
  };
}

function normalizeWeather(
  raw: any,
): FootballWeatherInfo | undefined {
  const weather =
    raw?.weather;

  if (!weather) {
    return undefined;
  }

  const temperature =
    numberOrUndefined(
      weather.temperature,
    );

  const condition =
    stringOrUndefined(
      weather.displayValue,
    ) ??
    stringOrUndefined(
      weather.conditionId,
    );

  const windMph =
    numberOrUndefined(
      weather.wind?.speed,
    );

  const windDirection =
    stringOrUndefined(
      weather.wind?.direction,
    );

  return {
    temperatureF:
      temperature,

    condition,

    windMph,

    windDirection,

    humidityPercent:
      numberOrUndefined(
        weather.humidity,
      ),
  };
}

function statMap(
  statistics: any[],
): Map<string, any> {
  const map =
    new Map<string, any>();

  for (const stat of statistics) {
    const name =
      stat?.name ??
      stat?.displayName ??
      stat?.label;

    if (
      typeof name === "string"
    ) {
      map.set(
        name.toLowerCase(),
        stat,
      );
    }
  }

  return map;
}

function statValue(
  map: Map<string, any>,
  ...keys: string[]
): unknown {
  for (const key of keys) {
    const stat =
      map.get(
        key.toLowerCase(),
      );

    if (stat) {
      return (
        stat.displayValue ??
        stat.value
      );
    }
  }

  return undefined;
}

function normalizeTeamStats(
  boxscore: any,
): FootballTeamStatBlock[] {
  const teams =
    Array.isArray(
      boxscore?.teams,
    )
      ? boxscore.teams
      : [];

  return teams.map(
    (entry: any) => {
      const team =
        entry?.team ?? {};

      const statistics =
        Array.isArray(
          entry?.statistics,
        )
          ? entry.statistics
          : [];

      const map =
        statMap(statistics);

      const thirdDown =
        parseFraction(
          statValue(
            map,
            "thirdDownEff",
            "third down efficiency",
            "3rd down efficiency",
          ),
        );

      const fourthDown =
        parseFraction(
          statValue(
            map,
            "fourthDownEff",
            "fourth down efficiency",
            "4th down efficiency",
          ),
        );

      const redZone =
        parseFraction(
          statValue(
            map,
            "redZoneAttempts",
            "red zone",
          ),
        );

      const penalties =
        parsePenaltyStat(
          statValue(
            map,
            "totalPenaltiesYards",
            "penalties",
          ),
        );

      return {
        teamId:
          team.id !== undefined
            ? String(team.id)
            : undefined,

        teamAbbreviation:
          stringOrUndefined(
            team.abbreviation,
          ),

        stats: {
          firstDowns:
            parseStatNumber(
              statValue(
                map,
                "firstDowns",
                "first downs",
              ),
            ),

          totalYards:
            parseStatNumber(
              statValue(
                map,
                "totalYards",
                "total yards",
              ),
            ),

          passingYards:
            parseStatNumber(
              statValue(
                map,
                "netPassingYards",
                "passingYards",
                "passing yards",
              ),
            ),

          rushingYards:
            parseStatNumber(
              statValue(
                map,
                "rushingYards",
                "rushing yards",
              ),
            ),

          turnovers:
            parseStatNumber(
              statValue(
                map,
                "turnovers",
              ),
            ),

          fumblesLost:
            parseStatNumber(
              statValue(
                map,
                "fumblesLost",
              ),
            ),

          interceptionsThrown:
            parseStatNumber(
              statValue(
                map,
                "interceptions",
                "interceptions thrown",
              ),
            ),

          penalties:
            penalties.penalties,

          penaltyYards:
            penalties.yards,

          possessionTime:
            stringOrUndefined(
              statValue(
                map,
                "possessionTime",
                "time of possession",
              ),
            ),

          thirdDownMade:
            thirdDown.made,

          thirdDownAttempts:
            thirdDown.attempts,

          fourthDownMade:
            fourthDown.made,

          fourthDownAttempts:
            fourthDown.attempts,

          sacksAllowed:
            parseStatNumber(
              statValue(
                map,
                "sacksYardsLost",
                "sacks",
              ),
            ),

          yardsPerPlay:
            parseStatNumber(
              statValue(
                map,
                "yardsPerPlay",
                "yards per play",
              ),
            ),

          redZoneMade:
            redZone.made,

          redZoneAttempts:
            redZone.attempts,
        },
      };
    },
  );
}

function normalizePlayerStats(
  boxscore: any,
): FootballPlayerStats[] {
  const teams =
    Array.isArray(
      boxscore?.players,
    )
      ? boxscore.players
      : [];

  const players:
    FootballPlayerStats[] = [];

  for (const teamEntry of teams) {
    const team =
      teamEntry?.team ?? {};

    const teamId =
      team.id !== undefined
        ? String(team.id)
        : undefined;

    const teamAbbreviation =
      stringOrUndefined(
        team.abbreviation,
      );

    const categories =
      Array.isArray(
        teamEntry?.statistics,
      )
        ? teamEntry.statistics
        : [];

    const playerMap =
      new Map<
        string,
        FootballPlayerStats
      >();

    function getPlayer(
      athlete: any,
    ) {
      const id =
        athlete?.id !==
        undefined
          ? String(athlete.id)
          : athlete?.uid ??
            athlete?.displayName ??
            athlete?.name;

      const key =
        String(id ?? "unknown");

      let player =
        playerMap.get(key);

      if (!player) {
        player = {
          playerId:
            athlete?.id !==
            undefined
              ? String(athlete.id)
              : undefined,

          name:
            athlete?.displayName ??
            athlete?.fullName ??
            athlete?.name ??
            "Unknown Player",

          shortName:
            stringOrUndefined(
              athlete?.shortName,
            ),

          teamId,

          teamAbbreviation,

          position:
            stringOrUndefined(
              athlete?.position
                ?.abbreviation,
            ),

          jerseyNumber:
            athlete?.jersey !==
            undefined
              ? String(
                  athlete.jersey,
                )
              : undefined,
        };

        playerMap.set(
          key,
          player,
        );
      }

      return player;
    }

    for (const category of categories) {
      const name =
        String(
          category?.name ?? "",
        ).toLowerCase();

      const labels =
        Array.isArray(
          category?.labels,
        )
          ? category.labels
          : [];

      const athletes =
        Array.isArray(
          category?.athletes,
        )
          ? category.athletes
          : [];

      for (const entry of athletes) {
        const athlete =
          entry?.athlete ?? {};

        const player =
          getPlayer(athlete);

        const stats =
          Array.isArray(
            entry?.stats,
          )
            ? entry.stats
            : [];

        const values =
          new Map<
            string,
            string
          >();

        labels.forEach(
          (
            label: unknown,
            index: number,
          ) => {
            if (
              typeof label ===
              "string"
            ) {
              const value =
                stats[index];

              if (
                value !==
                undefined
              ) {
                values.set(
                  label.toLowerCase(),
                  String(value),
                );
              }
            }
          },
        );

        const get = (
          ...keys: string[]
        ) => {
          for (const key of keys) {
            const value =
              values.get(
                key.toLowerCase(),
              );

            if (
              value !==
              undefined
            ) {
              return value;
            }
          }

          return undefined;
        };

        if (
          name.includes(
            "passing",
          )
        ) {
          const compAtt =
            get("C/ATT");

          let completions:
            number | undefined;

          let attempts:
            number | undefined;

          if (compAtt) {
            const [
              comp,
              att,
            ] =
              compAtt.split("/");

            completions =
              parseStatNumber(
                comp,
              );

            attempts =
              parseStatNumber(
                att,
              );
          }

          player.passing = {
            completions,

            attempts,

            yards:
              parseStatNumber(
                get("YDS"),
              ),

            touchdowns:
              parseStatNumber(
                get("TD"),
              ),

            interceptions:
              parseStatNumber(
                get("INT"),
              ),

            sacks:
              parseStatNumber(
                get("SACKS"),
              ),

            yardsPerAttempt:
              parseStatNumber(
                get("AVG"),
              ),

            passerRating:
              parseStatNumber(
                get("RTG"),
              ),

            long:
              parseStatNumber(
                get("LNG"),
              ),
          };
        }

        if (
          name.includes(
            "rushing",
          )
        ) {
          player.rushing = {
            attempts:
              parseStatNumber(
                get("CAR"),
              ),

            yards:
              parseStatNumber(
                get("YDS"),
              ),

            touchdowns:
              parseStatNumber(
                get("TD"),
              ),

            yardsPerCarry:
              parseStatNumber(
                get("AVG"),
              ),

            longest:
              parseStatNumber(
                get("LNG"),
              ),

            fumbles:
              parseStatNumber(
                get("FUM"),
              ),
          };
        }

        if (
          name.includes(
            "receiving",
          )
        ) {
          player.receiving = {
            receptions:
              parseStatNumber(
                get("REC"),
              ),

            targets:
              parseStatNumber(
                get("TGTS", "TGT"),
              ),

            yards:
              parseStatNumber(
                get("YDS"),
              ),

            touchdowns:
              parseStatNumber(
                get("TD"),
              ),

            yardsPerReception:
              parseStatNumber(
                get("AVG"),
              ),

            longest:
              parseStatNumber(
                get("LNG"),
              ),
          };
        }

        if (
          name.includes(
            "defensive",
          ) ||
          name.includes(
            "defense",
          )
        ) {
          player.defense = {
            totalTackles:
              parseStatNumber(
                get("TOT"),
              ),

            soloTackles:
              parseStatNumber(
                get("SOLO"),
              ),

            sacks:
              parseStatNumber(
                get("SACKS"),
              ),

            tacklesForLoss:
              parseStatNumber(
                get("TFL"),
              ),

            passesDefended:
              parseStatNumber(
                get("PD"),
              ),

            interceptions:
              parseStatNumber(
                get("INT"),
              ),

            forcedFumbles:
              parseStatNumber(
                get("FF"),
              ),

            fumbleRecoveries:
              parseStatNumber(
                get("FR"),
              ),
          };
        }

        if (
          name.includes(
            "kicking",
          )
        ) {
          const fg =
            get("FG");

          const xp =
            get("XP");

          const fieldGoals =
            fg
              ? parseFraction(
                  fg.replace(
                    "/",
                    "-",
                  ),
                )
              : {};

          const extraPoints =
            xp
              ? parseFraction(
                  xp.replace(
                    "/",
                    "-",
                  ),
                )
              : {};

          player.kicking = {
            fieldGoalsMade:
              fieldGoals.made,

            fieldGoalsAttempted:
              fieldGoals.attempts,

            extraPointsMade:
              extraPoints.made,

            extraPointsAttempted:
              extraPoints.attempts,

            longestFieldGoal:
              parseStatNumber(
                get("LNG"),
              ),

            points:
              parseStatNumber(
                get("PTS"),
              ),
          };
        }

        if (
          name.includes(
            "punting",
          )
        ) {
          player.punting = {
            punts:
              parseStatNumber(
                get("NO"),
              ),

            yards:
              parseStatNumber(
                get("YDS"),
              ),

            average:
              parseStatNumber(
                get("AVG"),
              ),

            longest:
              parseStatNumber(
                get("LNG"),
              ),

            inside20:
              parseStatNumber(
                get("IN 20"),
              ),

            touchbacks:
              parseStatNumber(
                get("TB"),
              ),
          };
        }

        if (
          name.includes(
            "return",
          )
        ) {
          player.returns = {
            kickoffReturns:
              parseStatNumber(
                get("KR"),
              ),

            kickoffReturnYards:
              parseStatNumber(
                get("KRYDS"),
              ),

            kickoffReturnTouchdowns:
              parseStatNumber(
                get("KRTD"),
              ),

            puntReturns:
              parseStatNumber(
                get("PR"),
              ),

            puntReturnYards:
              parseStatNumber(
                get("PRYDS"),
              ),

            puntReturnTouchdowns:
              parseStatNumber(
                get("PRTD"),
              ),
          };
        }
      }
    }

    players.push(
      ...playerMap.values(),
    );
  }

  return players;
}

function normalizeScoringPlays(
  raw: any,
): FootballScoringPlay[] {
  const plays =
    Array.isArray(raw)
      ? raw
      : [];

  return plays.map(
    (play: any) => ({
      id:
        play?.id !== undefined
          ? String(play.id)
          : undefined,

      period:
        numberOrUndefined(
          play?.period?.number,
        ),

      clock:
        stringOrUndefined(
          play?.clock
            ?.displayValue,
        ),

      teamId:
        play?.team?.id !==
        undefined
          ? String(play.team.id)
          : undefined,

      teamAbbreviation:
        stringOrUndefined(
          play?.team
            ?.abbreviation,
        ),

      description:
        play?.text ??
        play?.type?.text ??
        "Scoring play",

      scoreAfter: {
        home:
          numberOrUndefined(
            play?.homeScore,
          ),

        away:
          numberOrUndefined(
            play?.awayScore,
          ),
      },
    }),
  );
}

export async function getNFLSummary(
  eventId: number | string,
): Promise<NFLNormalizedSummary> {
  const url =
    `${ESPN_NFL_BASE}/summary?event=` +
    encodeURIComponent(
      String(eventId),
    );

  const response =
    await fetch(url, {
      cache: "no-store",

      headers: {
        Accept:
          "application/json",
      },
    });

  if (!response.ok) {
    throw new Error(
      `ESPN NFL summary failed: ` +
        `${response.status} ` +
        `${response.statusText}`,
    );
  }

  const data =
    await response.json();

  if (
    data?.code &&
    data?.message
  ) {
    throw new Error(
      `ESPN NFL summary error: ` +
        `${data.code} ${data.message}`,
    );
  }

  const header =
    data?.header ?? {};

  const competitors =
    getCompetitors(header);

  const {
    home: homeCompetitor,
    away: awayCompetitor,
  } =
    findHomeAway(
      competitors,
    );

  if (
    !homeCompetitor ||
    !awayCompetitor
  ) {
    throw new Error(
      "ESPN NFL summary did not contain home and away competitors.",
    );
  }

  const boxscore =
    data?.boxscore ?? {};

  return {
    eventId:
      String(eventId),

    home:
      normalizeTeamState(
        homeCompetitor,
      ),

    away:
      normalizeTeamState(
        awayCompetitor,
      ),

    game:
      normalizeGameInfo(
        data?.gameInfo,
        header,
      ),

    venue:
      normalizeVenue(
        data?.gameInfo,
        header,
      ),

    broadcast:
      normalizeBroadcast(
        data?.gameInfo,
        header,
      ),

    weather:
      normalizeWeather(
        data?.gameInfo,
      ),

    teamStats:
      normalizeTeamStats(
        boxscore,
      ),

    playerStats:
      normalizePlayerStats(
        boxscore,
      ),

    scoringPlays:
      normalizeScoringPlays(
        data?.scoringPlays,
      ),

    raw: data,
  };
}