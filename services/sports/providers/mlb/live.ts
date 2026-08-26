import type {
    BaseballAtBat,
    BaseballBaseRunner,
    BaseballBases,
    BaseballCount,
    BaseballInningHalf,
    BaseballLiveData,
    BaseballPitch,
    BaseballPlay,
    BaseballPlayerRef,
} from "@/core/contracts/sports/Baseball";
import { getMlbGameUniforms } from "./uniforms";

const MLB_STATS_BASE = "https://statsapi.mlb.com";

function normalizeInningHalf(
    value?: string,
): BaseballInningHalf {
    switch (value?.toLowerCase()) {
        case "top":
            return "top";

        case "bottom":
            return "bottom";

        case "middle":
            return "middle";

        case "end":
            return "end";

        default:
            return "unknown";
    }
}

function numberOrUndefined(
    value: unknown,
): number | undefined {
    return typeof value === "number"
        ? value
        : undefined;
}

function stringOrUndefined(
    value: unknown,
): string | undefined {
    return typeof value === "string"
        ? value
        : undefined;
}

function normalizePlayer(
    raw: any,
): BaseballPlayerRef | undefined {
    if (!raw) {
        return undefined;
    }

    return {
        id:
            raw.id !== undefined
                ? String(raw.id)
                : undefined,

        name:
            raw.fullName ??
            raw.name ??
            raw.boxscoreName ??
            "Unknown Player",

        shortName:
            raw.shortName ??
            raw.boxscoreName ??
            undefined,

        position:
            raw.position?.abbreviation ??
            raw.position?.name ??
            undefined,

        jerseyNumber:
            raw.jerseyNumber !== undefined
                ? String(raw.jerseyNumber)
                : undefined,

        teamId:
            raw.currentTeam?.id !== undefined
                ? String(raw.currentTeam.id)
                : undefined,
    };
}

function normalizeCount(
    raw: any,
): BaseballCount | undefined {
    if (!raw) {
        return undefined;
    }

    return {
        balls: numberOrUndefined(raw.balls),
        strikes: numberOrUndefined(raw.strikes),
        outs: numberOrUndefined(raw.outs),
    };
}

function normalizePitch(
    raw: any,
): BaseballPitch | undefined {
    if (!raw) {
        return undefined;
    }

    const details = raw.details ?? {};
    const pitchData = raw.pitchData ?? {};
    const coordinates = pitchData.coordinates ?? {};
    const breaks = pitchData.breaks ?? {};

    return {
        id:
            raw.playId ??
            raw.pitchNumber?.toString() ??
            undefined,

        pitchNumber:
            numberOrUndefined(raw.pitchNumber),

        typeCode:
            stringOrUndefined(details.type?.code),

        typeName:
            stringOrUndefined(details.type?.description),

        description:
            stringOrUndefined(details.description),

        result:
            stringOrUndefined(details.code),

        velocityMph:
            numberOrUndefined(pitchData.startSpeed),

        spinRateRpm:
            numberOrUndefined(breaks.spinRate),

        zone:
            numberOrUndefined(pitchData.zone),

        horizontalBreakInches:
            numberOrUndefined(breaks.breakHorizontal),

        verticalBreakInches:
            numberOrUndefined(
                breaks.breakVerticalInduced,
            ),

        extensionFeet:
            numberOrUndefined(pitchData.extension),

        plateX:
            numberOrUndefined(coordinates.pX),

        plateZ:
            numberOrUndefined(coordinates.pZ),

        isStrike:
            details.isStrike === true,

        isBall:
            details.isBall === true,

        inPlay:
            details.isInPlay === true,
    };
}

function normalizeBaseRunner(
    raw: any,
    base: 1 | 2 | 3,
): BaseballBaseRunner | undefined {
    const player = normalizePlayer(raw);

    if (!player) {
        return undefined;
    }

    return {
        player,
        base,
        confirmed: true,
    };
}

function normalizeBases(
    offense: any,
): BaseballBases {
    return {
        first: normalizeBaseRunner(
            offense?.first,
            1,
        ),

        second: normalizeBaseRunner(
            offense?.second,
            2,
        ),

        third: normalizeBaseRunner(
            offense?.third,
            3,
        ),
    };
}

function normalizePlay(
    raw: any,
): BaseballPlay | undefined {
    if (!raw) {
        return undefined;
    }

    const result = raw.result ?? {};
    const matchup = raw.matchup ?? {};
    const about = raw.about ?? {};

    const pitchEvents = Array.isArray(
        raw.playEvents,
    )
        ? raw.playEvents.filter(
            (event: any) => event?.isPitch,
        )
        : [];

    const latestPitch =
        pitchEvents.length > 0
            ? normalizePitch(
                pitchEvents[
                pitchEvents.length - 1
                ],
            )
            : undefined;

    return {
        id:
            raw.playId ??
            (raw.atBatIndex !== undefined
                ? String(raw.atBatIndex)
                : undefined),

        sequence:
            numberOrUndefined(raw.atBatIndex),

        inning:
            numberOrUndefined(about.inning),

        inningHalf:
            normalizeInningHalf(
                about.halfInning,
            ),

        description:
            result.description ??
            result.event ??
            "Baseball play",

        shortDescription:
            stringOrUndefined(result.event),

        eventType:
            stringOrUndefined(result.eventType),

        batter:
            normalizePlayer(matchup.batter),

        pitcher:
            normalizePlayer(matchup.pitcher),

        runsScored:
            numberOrUndefined(
                result.awayScore,
            ) !== undefined &&
                numberOrUndefined(
                    result.homeScore,
                ) !== undefined
                ? undefined
                : undefined,

        rbi:
            numberOrUndefined(result.rbi),

        scoringPlay:
            result.isOut === false &&
            numberOrUndefined(result.rbi) !==
            undefined &&
            (result.rbi ?? 0) > 0,

        isAtBat:
            result.type === "atBat",

        result:
            stringOrUndefined(result.event),

        pitch: latestPitch,
    };
}

function normalizeCurrentAtBat(
    raw: any,
): BaseballAtBat | undefined {
    if (!raw) {
        return undefined;
    }

    const matchup = raw.matchup ?? {};
    const about = raw.about ?? {};
    const result = raw.result ?? {};

    const pitches = Array.isArray(
        raw.playEvents,
    )
        ? raw.playEvents
            .filter(
                (event: any) => event?.isPitch,
            )
            .map(normalizePitch)
            .filter(
                (
                    pitch: BaseballPitch | undefined,
                ): pitch is BaseballPitch =>
                    Boolean(pitch),
            )
        : [];

    return {
        id:
            raw.playId ??
            (raw.atBatIndex !== undefined
                ? String(raw.atBatIndex)
                : undefined),

        atBatIndex:
            numberOrUndefined(raw.atBatIndex),

        inning:
            numberOrUndefined(about.inning),

        inningHalf:
            normalizeInningHalf(
                about.halfInning,
            ),

        batter:
            normalizePlayer(matchup.batter),

        pitcher:
            normalizePlayer(matchup.pitcher),

        count:
            normalizeCount(raw.count),

        description:
            stringOrUndefined(
                result.description,
            ),

        result:
            stringOrUndefined(result.event),

        pitches,
    };
}
function normalizeLinescore(raw: any) {
    const innings = Array.isArray(raw?.innings)
        ? raw.innings
        : [];

    return {
        currentInning: numberOrUndefined(
            raw?.currentInning,
        ),

        currentInningHalf: normalizeInningHalf(
            raw?.inningHalf,
        ),

        innings: innings.map((inning: any) => ({
            inning:
                numberOrUndefined(inning?.num) ?? 0,

            home: {
                runs: numberOrUndefined(
                    inning?.home?.runs,
                ),
                hits: numberOrUndefined(
                    inning?.home?.hits,
                ),
                errors: numberOrUndefined(
                    inning?.home?.errors,
                ),
            },

            away: {
                runs: numberOrUndefined(
                    inning?.away?.runs,
                ),
                hits: numberOrUndefined(
                    inning?.away?.hits,
                ),
                errors: numberOrUndefined(
                    inning?.away?.errors,
                ),
            },
        })),

        home: {
            runs: numberOrUndefined(
                raw?.teams?.home?.runs,
            ),
            hits: numberOrUndefined(
                raw?.teams?.home?.hits,
            ),
            errors: numberOrUndefined(
                raw?.teams?.home?.errors,
            ),
        },

        away: {
            runs: numberOrUndefined(
                raw?.teams?.away?.runs,
            ),
            hits: numberOrUndefined(
                raw?.teams?.away?.hits,
            ),
            errors: numberOrUndefined(
                raw?.teams?.away?.errors,
            ),
        },
    };
}

function normalizeVenue(raw: any) {
    if (!raw) {
        return undefined;
    }

    return {
        name: stringOrUndefined(raw.name),

        city: stringOrUndefined(
            raw.location?.city,
        ),

        state: stringOrUndefined(
            raw.location?.stateAbbrev ??
            raw.location?.state,
        ),

        roof: stringOrUndefined(
            raw.fieldInfo?.roofType,
        ),

        surface: stringOrUndefined(
            raw.fieldInfo?.turfType,
        ),
    };
}

function normalizeWeather(raw: any) {
    if (!raw) {
        return undefined;
    }

    return {
        temperatureF: numberOrUndefined(
            raw.temp,
        ),

        condition: stringOrUndefined(
            raw.condition,
        ),

        wind: stringOrUndefined(
            raw.wind,
        ),
    };
}

function normalizeProbablePitcher(
    raw: any,
    teamId?: string,
    teamAbbreviation?: string,
) {
    const player = normalizePlayer(raw);

    if (!player) {
        return undefined;
    }

    return {
        teamId,
        teamAbbreviation,
        player,
    };
}

function normalizeBattingStats(raw: any) {
    if (!raw) {
        return undefined;
    }

    return {
        atBats: numberOrUndefined(raw.atBats),
        runs: numberOrUndefined(raw.runs),
        hits: numberOrUndefined(raw.hits),
        doubles: numberOrUndefined(raw.doubles),
        triples: numberOrUndefined(raw.triples),
        homeRuns: numberOrUndefined(raw.homeRuns),
        rbi: numberOrUndefined(raw.rbi),
        walks: numberOrUndefined(raw.baseOnBalls),
        strikeouts: numberOrUndefined(raw.strikeOuts),
        stolenBases: numberOrUndefined(raw.stolenBases),

        average: stringOrUndefined(raw.avg),

        onBasePercentage:
            stringOrUndefined(raw.obp),

        sluggingPercentage:
            stringOrUndefined(raw.slg),

        ops: stringOrUndefined(raw.ops),
    };
}

function normalizePitchingStats(raw: any) {
    if (!raw) {
        return undefined;
    }

    return {
        inningsPitched:
            raw.inningsPitched !== undefined
                ? String(raw.inningsPitched)
                : undefined,

        hits: numberOrUndefined(raw.hits),

        runs: numberOrUndefined(raw.runs),

        earnedRuns:
            numberOrUndefined(raw.earnedRuns),

        walks:
            numberOrUndefined(raw.baseOnBalls),

        strikeouts:
            numberOrUndefined(raw.strikeOuts),

        homeRuns:
            numberOrUndefined(raw.homeRuns),

        pitchesThrown:
            numberOrUndefined(
                raw.numberOfPitches,
            ),

        strikes:
            numberOrUndefined(raw.strikes),

        era:
            raw.era !== undefined
                ? String(raw.era)
                : undefined,
    };
}

function normalizeFieldingStats(raw: any) {
    if (!raw) {
        return undefined;
    }

    return {
        putouts:
            numberOrUndefined(raw.putOuts),

        assists:
            numberOrUndefined(raw.assists),

        errors:
            numberOrUndefined(raw.errors),
    };
}

function normalizeBoxScoreTeam(
    raw: any,
) {
    if (!raw) {
        return undefined;
    }

    const players =
        raw.players &&
            typeof raw.players === "object"
            ? Object.values(raw.players)
            : [];

    return {
        teamId:
            raw.team?.id !== undefined
                ? String(raw.team.id)
                : undefined,

        teamAbbreviation:
            stringOrUndefined(
                raw.team?.abbreviation,
            ),

        players: players.map(
            (playerRaw: any) => ({
                player:
                    normalizePlayer(
                        playerRaw.person,
                    ) ?? {
                        id:
                            playerRaw.person?.id !== undefined
                                ? String(
                                    playerRaw.person.id,
                                )
                                : undefined,

                        name:
                            playerRaw.person?.fullName ??
                            "Unknown Player",

                        position:
                            playerRaw.position
                                ?.abbreviation,
                    },

                batting:
                    normalizeBattingStats(
                        playerRaw.stats?.batting,
                    ),

                pitching:
                    normalizePitchingStats(
                        playerRaw.stats?.pitching,
                    ),

                fielding:
                    normalizeFieldingStats(
                        playerRaw.stats?.fielding,
                    ),
            }),
        ),

        batting:
            normalizeBattingStats(
                raw.teamStats?.batting,
            ),

        pitching:
            normalizePitchingStats(
                raw.teamStats?.pitching,
            ),
    };
}



export async function getMLBLiveData(
    gamePk: number | string,
): Promise<BaseballLiveData> {
    const url =
        `${MLB_STATS_BASE}/api/v1.1/game/` +
        `${gamePk}/feed/live`;

    const response = await fetch(url, {
        cache: "no-store",

        headers: {
            Accept: "application/json",
        },
    });

    if (!response.ok) {
        throw new Error(
            `MLB live feed failed: ` +
            `${response.status} ` +
            `${response.statusText}`,
        );
    }

    const data = await response.json();

    const gameData =
        data.gameData ?? {};
    const venueData =
        gameData.venue;

    const weatherData =
        gameData.weather;

    const probablePitchers =
        gameData.probablePitchers ?? {};
    const liveData =
        data.liveData ?? {};
    const boxscore =
        liveData.boxscore ?? {};

    const uniforms = await getMlbGameUniforms(gamePk);

    const linescore =
        liveData.linescore ?? {};

    const plays =
        liveData.plays ?? {};

    const currentPlay =
        plays.currentPlay;

    const allPlays = Array.isArray(
        plays.allPlays,
    )
        ? plays.allPlays
        : [];

    const homeTeam =
        gameData.teams?.home ?? {};

    const awayTeam =
        gameData.teams?.away ?? {};

    const homeLine =
        linescore.teams?.home ?? {};

    const awayLine =
        linescore.teams?.away ?? {};

    const offense =
        linescore.offense ?? {};

    const defense =
        linescore.defense ?? {};

    const currentAtBat =
        normalizeCurrentAtBat(currentPlay);

    const currentPitchEvents =
        Array.isArray(
            currentPlay?.playEvents,
        )
            ? currentPlay.playEvents.filter(
                (event: any) =>
                    event?.isPitch,
            )
            : [];

    const latestPitch =
        currentPitchEvents.length > 0
            ? normalizePitch(
                currentPitchEvents[
                currentPitchEvents.length -
                1
                ],
            )
            : undefined;

    const recentPlays =
        allPlays
            .slice(-5)
            .map(normalizePlay)
            .filter(
                (
                    play: BaseballPlay | undefined,
                ): play is BaseballPlay =>
                    Boolean(play),
            );

    const completedPlays =
        allPlays.filter(
            (play: any) =>
                play?.about?.isComplete === true,
        );

    const latestCompletedPlay =
        completedPlays.length > 0
            ? normalizePlay(
                completedPlays[
                completedPlays.length - 1
                ],
            )
            : undefined;

    /*
     * Important:
     *
     * During a live game MLB's
     * currentPlay.count can be newer than
     * linescore balls/strikes.
     *
     * Prefer currentPlay for the active
     * at-bat and use linescore as fallback.
     */
    const count =
        normalizeCount(
            currentPlay?.count,
        ) ??
        normalizeCount({
            balls: linescore.balls,
            strikes: linescore.strikes,
            outs: linescore.outs,
        });

    return {
        eventId: `mlb-${gamePk}`,

        sport: "mlb",

        generatedAt:
            new Date().toISOString(),

        stale: false,

        sources: [
            {
                id: "mlb-stats-live",

                sport: "mlb",

                name: "MLB Stats API",

                official: true,

                status: "ok",

                cacheSeconds: 3,

                fetchedAt:
                    new Date().toISOString(),

                capabilities: {
                    schedule: true,
                    liveScore: true,
                    liveState: true,
                    playByPlay: true,
                    stats: true,
                    weather: true,
                },
            },
        ],

        away: {
            team: {
                id:
                    awayTeam.id !== undefined
                        ? String(awayTeam.id)
                        : undefined,

                name:
                    awayTeam.name ??
                    "Away",

                abbreviation:
                    awayTeam.abbreviation ??
                    undefined,
            },

            score:
                numberOrUndefined(
                    awayLine.runs,
                ) ?? 0,

            hits:
                numberOrUndefined(
                    awayLine.hits,
                ),

            errors:
                numberOrUndefined(
                    awayLine.errors,
                ),

            uniform: uniforms.away,
        },

        home: {
            team: {
                id:
                    homeTeam.id !== undefined
                        ? String(homeTeam.id)
                        : undefined,

                name:
                    homeTeam.name ??
                    "Home",

                abbreviation:
                    homeTeam.abbreviation ??
                    undefined,
            },

            score:
                numberOrUndefined(
                    homeLine.runs,
                ) ?? 0,

            hits:
                numberOrUndefined(
                    homeLine.hits,
                ),

            errors:
                numberOrUndefined(
                    homeLine.errors,
                ),

            uniform: uniforms.home,
        },

        inning:
            numberOrUndefined(
                linescore.currentInning,
            ),

        inningHalf:
            normalizeInningHalf(
                linescore.inningHalf,
            ),

        count,

        bases:
            normalizeBases(offense),

        matchup: {
            batter:
                normalizePlayer(
                    offense.batter,
                ) ??
                normalizePlayer(
                    currentPlay?.matchup?.batter,
                ),

            pitcher:
                normalizePlayer(
                    defense.pitcher,
                ) ??
                normalizePlayer(
                    currentPlay?.matchup?.pitcher,
                ),

            onDeck:
                normalizePlayer(
                    offense.onDeck,
                ),

            inHole:
                normalizePlayer(
                    offense.inHole,
                ),
        },

        currentAtBat,

        latestPitch,

        latestPlay:
            latestCompletedPlay,

        recentPlays,

        linescore:
            normalizeLinescore(linescore),

        venue:
            normalizeVenue(venueData),

        weather:
            normalizeWeather(weatherData),

        probablePitchers: {
            away: normalizeProbablePitcher(
                probablePitchers.away,
                awayTeam.id !== undefined
                    ? String(awayTeam.id)
                    : undefined,
                awayTeam.abbreviation,
            ),

            home: normalizeProbablePitcher(
                probablePitchers.home,
                homeTeam.id !== undefined
                    ? String(homeTeam.id)
                    : undefined,
                homeTeam.abbreviation,
            ),
        },

        boxScore: {
            away:
                normalizeBoxScoreTeam(
                    boxscore.teams?.away,
                ),

            home:
                normalizeBoxScoreTeam(
                    boxscore.teams?.home,
                ),
        },

    };
}
export async function getMLBPlayByPlay(
  gamePk: number | string,
) {
  const url =
    `${MLB_STATS_BASE}/api/v1.1/game/` +
    `${gamePk}/feed/live`;

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `MLB play-by-play failed: ${response.status}`,
    );
  }

  const data = await response.json();

  const allPlays = Array.isArray(
    data?.liveData?.plays?.allPlays,
  )
    ? data.liveData.plays.allPlays
    : [];

  return allPlays
    .map(normalizePlay)
    .filter(Boolean);
}
