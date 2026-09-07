import type {
  CosmicSportsLive,
  CosmicSportsResponse,
} from "../data/sportsClient";

const MAX_CONTEXT_LINE_LENGTH = 25;

function truncateContextLine(content: string) {
  return content.length > MAX_CONTEXT_LINE_LENGTH
    ? `${content.slice(0, MAX_CONTEXT_LINE_LENGTH - 1)}…`
    : content;
}

function validScore(score: number | null | undefined): score is number {
  return typeof score === "number" && Number.isFinite(score);
}

export function formatSportsScore(score: number | null | undefined) {
  return validScore(score) ? String(score) : "—";
}

function formatInning(
  inning: number | null | undefined,
  inningHalf: string | null | undefined,
  period: string | number | null | undefined,
) {
  if (typeof inning === "number" && Number.isInteger(inning) && inning > 0) {
    const ordinal = `${inning}${inning % 10 === 1 && inning % 100 !== 11
      ? "st"
      : inning % 10 === 2 && inning % 100 !== 12
        ? "nd"
        : inning % 10 === 3 && inning % 100 !== 13
          ? "rd"
          : "th"}`;
    const normalizedHalf = inningHalf?.trim().toLowerCase();
    if (normalizedHalf === "top") return `▲ ${ordinal}`;
    if (normalizedHalf === "bottom") return `▼ ${ordinal}`;
    return ordinal;
  }

  if (period !== null && period !== undefined && String(period).trim()) {
    return String(period);
  }

  return "";
}

function validInteger(
  value: number | null | undefined,
  minimum: number,
  maximum: number,
): value is number {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= minimum &&
    value <= maximum;
}

function hasBaseballLiveData(
  live: CosmicSportsLive,
) {
  if (!live || typeof live !== "object") return false;

  return (
    validInteger(live.inning, 1, Number.MAX_SAFE_INTEGER) ||
    validInteger(live.outs, 0, 2) ||
    validInteger(live.balls, 0, 3) ||
    validInteger(live.strikes, 0, 2) ||
    typeof live.firstBase === "boolean" ||
    typeof live.secondBase === "boolean" ||
    typeof live.thirdBase === "boolean"
  );
}

function formatBaseIndicator(live: CosmicSportsLive) {
  if (
    typeof live.firstBase !== "boolean" ||
    typeof live.secondBase !== "boolean" ||
    typeof live.thirdBase !== "boolean"
  ) {
    return "";
  }

  return [
    live.firstBase,
    live.secondBase,
    live.thirdBase,
  ]
    .map((occupied) => occupied ? "◆" : "◇")
    .join("");
}

function formatBaseballDetail(
  live: CosmicSportsLive,
) {
  const segments: string[] = [];

  if (validInteger(live.outs, 0, 2)) {
    segments.push(`${live.outs} OUT`);
  }

  if (
    validInteger(live.balls, 0, 3) &&
    validInteger(live.strikes, 0, 2)
  ) {
    segments.push(`${live.balls}–${live.strikes}`);
  }

  const bases = formatBaseIndicator(live);
  if (bases) {
    segments.push(bases);
  }

  return segments.join(" • ");
}

export function formatSportsContext(response: CosmicSportsResponse) {
  const game = response.game;
  if (!game || game.state !== "live") return "";

  const score = `${game.awayAbbr} ${formatSportsScore(game.awayScore)}–${formatSportsScore(game.homeScore)} ${game.homeAbbr}`;
  const period = formatInning(
    game.live?.inning,
    game.live?.inningHalf,
    game.live?.period,
  );
  const hasKnownInning =
    typeof game.live?.inning === "number" &&
    Number.isInteger(game.live.inning) &&
    game.live.inning > 0;

  const firstLine = period
    ? `${score}${hasKnownInning ? " " : " • "}${period}`
    : score;
  const detailLine =
    game.live &&
    hasBaseballLiveData(game.live)
      ? formatBaseballDetail(game.live)
      : "";

  return [firstLine, detailLine]
    .filter(Boolean)
    .map(truncateContextLine)
    .join("\n");
}
