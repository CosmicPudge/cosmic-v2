import type {
    FootballLiveData,
    FootballSituation,
} from "@/core/contracts/sports/Football";

import {
    getNFLSummary,
    type NFLNormalizedSummary,
} from "./summary";

import {
    getNFLPlays,
    type NFLNormalizedPlays,
} from "./plays";

import {
    getNFLDrives,
    type NFLNormalizedDrives,
} from "./drives";

type ProviderResult<T> =
    | {
        ok: true;
        value: T;
    }
    | {
        ok: false;
        error: Error;
    };

async function safely<T>(
    fn: () => Promise<T>,
): Promise<ProviderResult<T>> {
    try {
        return {
            ok: true,
            value: await fn(),
        };
    } catch (error) {
        return {
            ok: false,
            error:
                error instanceof Error
                    ? error
                    : new Error(
                        "Unknown NFL provider error.",
                    ),
        };
    }
}

function mergeSituation(
    summary:
        | NFLNormalizedSummary
        | undefined,

    plays:
        | NFLNormalizedPlays
        | undefined,
): FootballSituation {
    const situation =
        plays?.situation ?? {};

    const homeId =
        summary?.home.team.id;

    const awayId =
        summary?.away.team.id;

    let possession:
        | "home"
        | "away"
        | "unknown" =
        "unknown";

    if (
        situation.possessionTeamId &&
        homeId &&
        situation.possessionTeamId ===
        homeId
    ) {
        possession = "home";
    } else if (
        situation.possessionTeamId &&
        awayId &&
        situation.possessionTeamId ===
        awayId
    ) {
        possession = "away";
    }

    let possessionTeamAbbreviation:
        | string
        | undefined;

    if (
        situation.possessionTeamId ===
        homeId
    ) {
        possessionTeamAbbreviation =
            summary?.home.team.abbreviation;
    } else if (
        situation.possessionTeamId ===
        awayId
    ) {
        possessionTeamAbbreviation =
            summary?.away.team.abbreviation;
    }

    return {
        ...situation,

        possession,

        possessionTeamAbbreviation,
    };
}

export async function getNFLLiveData(
    eventId: number | string,
): Promise<FootballLiveData> {
    const fetchedAt =
        new Date().toISOString();

    /*
     * Fetch each source independently.
     *
     * One provider failing should not automatically
     * kill the entire NFL live response.
     */
    const [
        summaryResult,
        playsResult,
        drivesResult,
    ] = await Promise.all([
        safely(() =>
            getNFLSummary(eventId),
        ),

        safely(() =>
            getNFLPlays(eventId),
        ),

        safely(() =>
            getNFLDrives(eventId),
        ),
    ]);

    const summary =
        summaryResult.ok
            ? summaryResult.value
            : undefined;

    const plays =
        playsResult.ok
            ? playsResult.value
            : undefined;

    const drives =
        drivesResult.ok
            ? drivesResult.value
            : undefined;

    /*
     * Summary is currently our anchor because it provides
     * home/away team identity and scores.
     */
    if (!summary) {
        console.error(
            "[Sports][NFL] Summary provider failed:",
            summaryResult.ok
                ? undefined
                : summaryResult.error,
        );

        throw new Error(
            "NFL live data unavailable: summary provider failed.",
        );
    }

    if (!playsResult.ok) {
        console.warn(
            "[Sports][NFL] Plays provider failed:",
            playsResult.error,
        );
    }

    if (!drivesResult.ok) {
        console.warn(
            "[Sports][NFL] Drives provider failed:",
            drivesResult.error,
        );
    }

    const situation =
        mergeSituation(
            summary,
            plays,
        );

    const homeTimeouts =
        summary.home.timeoutsRemaining;

    const awayTimeouts =
        summary.away.timeoutsRemaining;

    const home = {
        ...summary.home,

        timeoutsRemaining:
            homeTimeouts,

        possession:
            situation.possession ===
            "home",
    };

    const away = {
        ...summary.away,

        timeoutsRemaining:
            awayTimeouts,

        possession:
            situation.possession ===
            "away",
    };

    const homeTeamStats =
        summary.teamStats?.find(
            (entry) =>
                entry.teamId ===
                home.team.id,
        );

    const awayTeamStats =
        summary.teamStats?.find(
            (entry) =>
                entry.teamId ===
                away.team.id,
        );

    const providerFailures =
        [
            summaryResult.ok
                ? null
                : "summary",

            playsResult.ok
                ? null
                : "plays",

            drivesResult.ok
                ? null
                : "drives",
        ].filter(
            (
                value,
            ): value is string =>
                Boolean(value),
        );

    return {
        eventId:
            `nfl-${eventId}`,

        sport: "nfl",

        generatedAt:
            fetchedAt,

        stale: false,

        sources: [
            {
                id: "espn-nfl-summary",

                sport: "nfl",

                name: "ESPN NFL Summary",

                official: false,

                status:
                    summaryResult.ok
                        ? "ok"
                        : "unavailable",

                cacheSeconds: 5,

                fetchedAt,

                capabilities: {
                    schedule: false,
                    liveScore: true,
                    liveState: true,
                    playByPlay: false,
                    stats: true,
                    weather: true,
                },
            },

            {
                id: "espn-nfl-plays",

                sport: "nfl",

                name: "ESPN NFL Core Plays",

                official: false,

                status:
                    playsResult.ok
                        ? "ok"
                        : "unavailable",

                cacheSeconds: 2,

                fetchedAt,

                capabilities: {
                    schedule: false,
                    liveScore: true,
                    liveState: true,
                    playByPlay: true,
                    stats: false,
                    weather: false,
                },
            },

            {
                id: "espn-nfl-drives",

                sport: "nfl",

                name: "ESPN NFL Core Drives",

                official: false,

                status:
                    drivesResult.ok
                        ? "ok"
                        : "unavailable",

                cacheSeconds: 3,

                fetchedAt,

                capabilities: {
                    schedule: false,
                    liveScore: false,
                    liveState: true,
                    playByPlay: false,
                    stats: false,
                    weather: false,
                },
            },
        ],

        game:
            summary.game,

        away,

        home,

        situation,

        currentDrive:
            drives?.currentDrive,

        drives:
            drives?.drives,

        latestPlay:
            plays?.latestPlay,

        recentPlays:
            plays?.recentPlays,

        plays:
            plays?.plays,

        scoringPlays:
            summary.scoringPlays,

        teamStats:
            summary.teamStats,

        playerStats:
            summary.playerStats,

        venue:
            summary.venue,

        broadcast:
            summary.broadcast,

        weather:
            summary.weather,

        turnovers: {
            home:
                homeTeamStats?.stats
                    .turnovers,

            away:
                awayTeamStats?.stats
                    .turnovers,
        },

        /*
         * We'll add ESPN probability data as its own
         * provider once the base NFL pipeline is verified.
         */
        winProbability:
            undefined,
    };
}