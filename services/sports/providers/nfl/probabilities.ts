import type {
  FootballWinProbability,
  FootballWinProbabilityPoint,
} from "@/core/contracts/sports/Football";

const ESPN_CORE_BASE =
  "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl";

export interface NFLNormalizedProbabilities {
  eventId: string;

  winProbability?: FootballWinProbability;

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
    const parsed =
      Number(value);

    if (
      Number.isFinite(
        parsed,
      )
    ) {
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

function unwrapItems(
  raw: any,
): any[] {
  if (
    Array.isArray(raw)
  ) {
    return raw;
  }

  if (
    Array.isArray(
      raw?.items,
    )
  ) {
    return raw.items;
  }

  return [];
}

function idFromRef(
  value: unknown,
): string | undefined {
  if (
    typeof value !== "string"
  ) {
    return undefined;
  }

  const clean =
    value.split("?")[0];

  const parts =
    clean.split("/");

  return (
    parts[
      parts.length - 1
    ] || undefined
  );
}

function normalizeProbability(
  raw: any,
  sequence: number,
): FootballWinProbabilityPoint | undefined {
  const home =
    numberOrUndefined(
      raw?.homeWinPercentage,
    );

  const away =
    numberOrUndefined(
      raw?.awayWinPercentage,
    );

  if (
    home === undefined &&
    away === undefined
  ) {
    return undefined;
  }

  return {
    playId:
      idFromRef(
        raw?.play?.$ref,
      ),

    sequence:
      numberOrUndefined(
        raw?.sequenceNumber,
      ) ??
      sequence,

    home,

    away,
  };
}

export async function getNFLProbabilities(
  eventId: number | string,
): Promise<NFLNormalizedProbabilities> {
  const event =
    encodeURIComponent(
      String(eventId),
    );

  const url =
    `${ESPN_CORE_BASE}/events/` +
    `${event}/competitions/` +
    `${event}/probabilities?limit=500`;

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
      `ESPN NFL probabilities failed: ` +
        `${response.status} ` +
        `${response.statusText}`,
    );
  }

  const data =
    await response.json();

  const items =
    unwrapItems(data);

  const history =
    items
      .map(
        (
          item: any,
          index: number,
        ) =>
          normalizeProbability(
            item,
            index,
          ),
      )
      .filter(
        (
          point,
        ): point is FootballWinProbabilityPoint =>
          Boolean(point),
      );

  const latest =
    history.length > 0
      ? history[
          history.length - 1
        ]
      : undefined;

  if (!latest) {
    return {
      eventId:
        String(eventId),

      raw: data,
    };
  }

  const previous =
    history.length > 1
      ? history[
          history.length - 2
        ]
      : undefined;

  const homeChange =
    latest.home !==
      undefined &&
    previous?.home !==
      undefined
      ? latest.home -
        previous.home
      : undefined;

  if (
    homeChange !== undefined
  ) {
    latest.homeChange =
      homeChange;
  }

  return {
    eventId:
      String(eventId),

    winProbability: {
      home:
        latest.home,

      away:
        latest.away,

      lastChange: {
        home:
          homeChange,

        away:
          homeChange !==
          undefined
            ? -homeChange
            : undefined,
      },

      history,
    },

    raw: data,
  };
}