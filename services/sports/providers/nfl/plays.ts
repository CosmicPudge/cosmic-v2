import type {
  FootballPlay,
  FootballPlayType,
  FootballSituation,
} from "@/core/contracts/sports/Football";

const ESPN_CORE_BASE =
  "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl";

export interface NFLNormalizedPlays {
  eventId: string;

  situation: FootballSituation;

  latestPlay?: FootballPlay;

  recentPlays: FootballPlay[];

  plays: FootballPlay[];

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

function getOffenseTeamId(
  raw: any,
): string | undefined {
  const participants =
    Array.isArray(
      raw?.teamParticipants,
    )
      ? raw.teamParticipants
      : [];

  const offense =
    participants.find(
      (participant: any) =>
        participant?.type ===
        "offense",
    );

  if (
    offense?.id !== undefined
  ) {
    return String(offense.id);
  }

  if (
    raw?.start?.team?.id !==
    undefined
  ) {
    return String(
      raw.start.team.id,
    );
  }

  return undefined;
}

function getPlayType(
  raw: any,
): FootballPlayType {
  const typeText =
    String(
      raw?.type?.text ??
        raw?.type?.name ??
        raw?.type?.abbreviation ??
        "",
    ).toLowerCase();

  const text =
    String(
      raw?.text ?? "",
    ).toLowerCase();

  const combined =
    `${typeText} ${text}`;

  if (
    combined.includes(
      "intercept",
    )
  ) {
    return "interception";
  }

  if (
    combined.includes(
      "fumble",
    )
  ) {
    return "fumble";
  }

  if (
    combined.includes(
      "sack",
    )
  ) {
    return "sack";
  }

  if (
    combined.includes(
      "punt",
    )
  ) {
    return "punt";
  }

  if (
    combined.includes(
      "kickoff",
    ) ||
    combined.includes(
      "kicks off",
    )
  ) {
    return "kickoff";
  }

  if (
    combined.includes(
      "field goal",
    )
  ) {
    return "field-goal";
  }

  if (
    combined.includes(
      "extra point",
    )
  ) {
    return "extra-point";
  }

  if (
    combined.includes(
      "two-point",
    ) ||
    combined.includes(
      "two point",
    )
  ) {
    return "two-point";
  }

  if (
    combined.includes(
      "penalty",
    )
  ) {
    return "penalty";
  }

  if (
    combined.includes(
      "timeout",
    )
  ) {
    return "timeout";
  }

  if (
    combined.includes(
      "kneel",
    )
  ) {
    return "kneel";
  }

  if (
    combined.includes(
      "spike",
    )
  ) {
    return "spike";
  }

  if (
    combined.includes(
      "end of",
    ) ||
    combined.includes(
      "end period",
    ) ||
    combined.includes(
      "end quarter",
    )
  ) {
    return "end-period";
  }

  if (
    combined.includes(
      "pass",
    )
  ) {
    return "pass";
  }

  if (
    combined.includes(
      "rush",
    ) ||
    combined.includes(
      "run ",
    ) ||
    combined.includes(
      "left end",
    ) ||
    combined.includes(
      "right end",
    ) ||
    combined.includes(
      "left tackle",
    ) ||
    combined.includes(
      "right tackle",
    ) ||
    combined.includes(
      "left guard",
    ) ||
    combined.includes(
      "right guard",
    ) ||
    combined.includes(
      "up the middle",
    )
  ) {
    return "rush";
  }

  return "other";
}

function normalizePlay(
  raw: any,
  sequence?: number,
): FootballPlay {
  const start =
    raw?.start ?? {};

  const end =
    raw?.end ?? {};

  const text =
    stringOrUndefined(
      raw?.text,
    ) ??
    stringOrUndefined(
      raw?.type?.text,
    ) ??
    "Football play";

  const lower =
    text.toLowerCase();

  const teamId =
    getOffenseTeamId(raw);

  return {
    id:
      raw?.id !== undefined
        ? String(raw.id)
        : undefined,

    sequence,

    period:
      numberOrUndefined(
        raw?.period?.number,
      ),

    clock:
      stringOrUndefined(
        raw?.clock?.displayValue,
      ),

    wallclock:
      stringOrUndefined(
        raw?.wallclock,
      ),

    type:
      getPlayType(raw),

    description:
      text,

    shortDescription:
      stringOrUndefined(
        raw?.type?.text,
      ),

    teamId,

    down:
      numberOrUndefined(
        start?.down,
      ),

    distance:
      numberOrUndefined(
        start?.distance,
      ),

    downDistanceText:
      stringOrUndefined(
        start?.downDistanceText,
      ),

    shortDownDistanceText:
      stringOrUndefined(
        start?.shortDownDistanceText,
      ),

    possessionText:
      stringOrUndefined(
        start?.possessionText,
      ),

    yardLine:
      numberOrUndefined(
        start?.yardLine,
      ),

    yardsToEndzone:
      numberOrUndefined(
        start?.yardsToEndzone,
      ),

    yardsGained:
      numberOrUndefined(
        raw?.statYardage,
      ),

    scoringPlay:
      raw?.scoringPlay === true,

    touchdown:
      lower.includes(
        "touchdown",
      ),

    turnover:
      raw?.isTurnover === true ||
      lower.includes(
        "intercepted",
      ) ||
      lower.includes(
        "fumble",
      ) &&
        lower.includes(
          "recovered by",
        ),

    penalty:
      raw?.isPenalty === true ||
      lower.includes(
        "penalty",
      ),

    firstDown:
      lower.includes(
        "first down",
      ),

    sack:
      lower.includes(
        "sacked",
      ) ||
      lower.includes(
        "sack",
      ),

    interception:
      lower.includes(
        "intercepted",
      ) ||
      lower.includes(
        "interception",
      ),

    fumble:
      lower.includes(
        "fumble",
      ),

    homeScore:
      numberOrUndefined(
        raw?.homeScore,
      ),

    awayScore:
      numberOrUndefined(
        raw?.awayScore,
      ),

    possessionAfterPlayTeamId:
      end?.team?.id !== undefined
        ? String(end.team.id)
        : undefined,
  };
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

function normalizeSituation(
  latestRaw: any,
): FootballSituation {
  const start =
    latestRaw?.start ?? {};

  const teamId =
    start?.team?.id !==
    undefined
      ? String(
          start.team.id,
        )
      : getOffenseTeamId(
          latestRaw,
        );

  const yardsToEndzone =
    numberOrUndefined(
      start?.yardsToEndzone,
    );

  return {
    quarter:
      numberOrUndefined(
        latestRaw?.period?.number,
      ),

    clock:
      stringOrUndefined(
        latestRaw?.clock
          ?.displayValue,
      ),

    possessionTeamId:
      teamId,

    down:
      numberOrUndefined(
        start?.down,
      ),

    distance:
      numberOrUndefined(
        start?.distance,
      ),

    fieldPosition: {
      yardLine:
        numberOrUndefined(
          start?.yardLine,
        ),

      display:
        stringOrUndefined(
          start?.possessionText,
        ),

      yardsToEndzone,
    },

    downDistanceText:
      stringOrUndefined(
        start?.downDistanceText,
      ),

    shortDownDistanceText:
      stringOrUndefined(
        start?.shortDownDistanceText,
      ),

    possessionText:
      stringOrUndefined(
        start?.possessionText,
      ),

    redZone:
      yardsToEndzone !==
        undefined
        ? yardsToEndzone <= 20
        : undefined,
  };
}

export async function getNFLPlays(
  eventId: number | string,
): Promise<NFLNormalizedPlays> {
  const event =
    encodeURIComponent(
      String(eventId),
    );

  const url =
    `${ESPN_CORE_BASE}/events/` +
    `${event}/competitions/` +
    `${event}/plays?limit=500`;

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
      `ESPN NFL plays failed: ` +
        `${response.status} ` +
        `${response.statusText}`,
    );
  }

  const data =
    await response.json();

  const rawItems =
    unwrapItems(data);

  /*
   * ESPN may return references for some Core collections.
   * We only normalize entries that actually contain play data.
   */
  const usableItems =
    rawItems.filter(
      (item: any) =>
        item &&
        typeof item ===
          "object" &&
        (
          item.text !==
            undefined ||
          item.start !==
            undefined ||
          item.period !==
            undefined
        ),
    );

  const plays =
    usableItems.map(
      (
        item: any,
        index: number,
      ) =>
        normalizePlay(
          item,
          index,
        ),
    );

  const latestRaw =
    usableItems.length > 0
      ? usableItems[
          usableItems.length -
            1
        ]
      : undefined;

  const latestPlay =
    plays.length > 0
      ? plays[
          plays.length - 1
        ]
      : undefined;

  return {
    eventId:
      String(eventId),

    situation:
      latestRaw
        ? normalizeSituation(
            latestRaw,
          )
        : {},

    latestPlay,

    recentPlays:
      plays.slice(-10),

    plays,

    raw: data,
  };
}