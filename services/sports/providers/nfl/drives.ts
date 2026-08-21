import type {
  FootballDriveSummary,
} from "@/core/contracts/sports/Football";

const ESPN_CORE_BASE =
  "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl";

export interface NFLNormalizedDrives {
  eventId: string;

  currentDrive?: FootballDriveSummary;

  drives: FootballDriveSummary[];

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

    return Number.isFinite(parsed)
      ? parsed
      : undefined;
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
  if (Array.isArray(raw)) {
    return raw;
  }

  if (Array.isArray(raw?.items)) {
    return raw.items;
  }

  return [];
}

function fieldPositionText(
  raw: any,
): string | undefined {
  return (
    stringOrUndefined(
      raw?.possessionText,
    ) ??
    stringOrUndefined(
      raw?.downDistanceText,
    )
  );
}

function normalizeDrive(
  raw: any,
): FootballDriveSummary {
  const start =
    raw?.start ?? {};

  const end =
    raw?.end ?? {};

  const timeElapsed =
    raw?.timeElapsed ??
    raw?.duration ??
    {};

  const result =
    raw?.result ??
    raw?.displayResult;

  const team =
    raw?.team ?? {};

  return {
    id:
      raw?.id !== undefined
        ? String(raw.id)
        : undefined,

    teamId:
      team?.id !== undefined
        ? String(team.id)
        : undefined,

    teamAbbreviation:
      stringOrUndefined(
        team?.abbreviation,
      ),

    description:
      stringOrUndefined(
        raw?.description,
      ) ??
      stringOrUndefined(
        raw?.shortDisplayResult,
      ) ??
      stringOrUndefined(
        raw?.displayResult,
      ),

    result:
      typeof result === "string"
        ? result
        : stringOrUndefined(
            result?.displayName,
          ) ??
          stringOrUndefined(
            result?.name,
          ),

    scoringDrive:
      raw?.isScore === true ||
      raw?.scoringDrive === true,

    startPeriod:
      numberOrUndefined(
        start?.period?.number ??
          start?.period,
      ),

    endPeriod:
      numberOrUndefined(
        end?.period?.number ??
          end?.period,
      ),

    startClock:
      stringOrUndefined(
        start?.clock?.displayValue ??
          start?.clock,
      ),

    endClock:
      stringOrUndefined(
        end?.clock?.displayValue ??
          end?.clock,
      ),

    startFieldPosition:
      fieldPositionText(start),

    endFieldPosition:
      fieldPositionText(end),

    plays:
      numberOrUndefined(
        raw?.offensivePlays ??
          raw?.plays ??
          raw?.playCount,
      ),

    yards:
      numberOrUndefined(
        raw?.yards,
      ),

    elapsedTime:
      stringOrUndefined(
        timeElapsed?.displayValue ??
          timeElapsed,
      ),

    firstDowns:
      numberOrUndefined(
        raw?.firstDowns,
      ),

    offensiveTouchdowns:
      numberOrUndefined(
        raw?.offensiveTouchdowns,
      ),

    fieldGoals:
      numberOrUndefined(
        raw?.fieldGoals,
      ),

    turnovers:
      numberOrUndefined(
        raw?.turnovers,
      ),
  };
}

function isUsableDrive(
  raw: any,
) {
  return Boolean(
    raw &&
      typeof raw === "object" &&
      (
        raw.id !== undefined ||
        raw.start !== undefined ||
        raw.end !== undefined ||
        raw.result !== undefined ||
        raw.description !== undefined
      ),
  );
}

export async function getNFLDrives(
  eventId: number | string,
): Promise<NFLNormalizedDrives> {
  const event =
    encodeURIComponent(
      String(eventId),
    );

  const url =
    `${ESPN_CORE_BASE}/events/` +
    `${event}/competitions/` +
    `${event}/drives?limit=100`;

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
      `ESPN NFL drives failed: ` +
        `${response.status} ` +
        `${response.statusText}`,
    );
  }

  const data =
    await response.json();

  const rawItems =
    unwrapItems(data);

  const usableItems =
    rawItems.filter(
      isUsableDrive,
    );

  const drives =
    usableItems.map(
      normalizeDrive,
    );

  /*
   * For a completed game this will simply be the last drive.
   *
   * During a live game we'll improve this further if ESPN exposes
   * explicit current-drive state in the live payload.
   */
  const currentDrive =
    drives.length > 0
      ? drives[
          drives.length - 1
        ]
      : undefined;

  return {
    eventId:
      String(eventId),

    currentDrive,

    drives,

    raw: data,
  };
}