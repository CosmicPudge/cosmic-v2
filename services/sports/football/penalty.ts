import type { FootballPenaltyState, FootballPlay } from "@/core/contracts/sports/Football";

export interface FootballPenaltyDisplay {
  type?: string;
  team?: string;
  yards?: number;
  detail?: string;
}

function titleCase(value: string) {
  return value.trim().toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function penaltyType(raw: string) {
  const text = raw.replace(/^.*?penalty\s+on\s+[^,]+,?/i, "").replace(/^penalty\s*[:,-]?\s*/i, "").trim();
  const withoutMetadata = text.split(/,\s*(?:\d+\s*yards?|accepted|declined|offsetting|no play|automatic|spot foul|enforcement|replay down)\b/i)[0];
  const cleaned = withoutMetadata.replace(/,\s*(?:offense|defense)\b/i, "").trim();
  return cleaned ? titleCase(cleaned) : undefined;
}

function hasNoPlay(raw: string) { return /no\s+play|play\s+(?:is\s+)?nullif/i.test(raw); }

export function normalizeFootballPenalty(penalty?: FootballPenaltyState, play?: FootballPlay, teamName?: string): FootballPenaltyDisplay | undefined {
  if (!penalty && !play?.penalty) return undefined;
  const raw = penalty?.text ?? play?.description ?? "";
  const display: FootballPenaltyDisplay = {
    type: penaltyType(raw),
    ...(teamName ? { team: teamName } : {}),
    ...(penalty?.yards ?? play?.penaltyYards) !== undefined ? { yards: penalty?.yards ?? play?.penaltyYards } : {},
  };
  const details = [
    penalty?.offsetting || /offsetting/i.test(raw) ? "Offsetting Penalties" : undefined,
    penalty?.declined || play?.penaltyDeclined || /declined/i.test(raw) ? "Declined" : undefined,
    penalty?.accepted || play?.penaltyAccepted ? undefined : undefined,
    hasNoPlay(raw) ? "No Play" : undefined,
    /automatic\s+(?:first|1st)\s+down/i.test(raw) ? "Automatic First Down" : undefined,
    /spot\s+foul/i.test(raw) ? "Spot Foul" : undefined,
  ].filter(Boolean).join(" · ");
  return { ...display, ...(details ? { detail: details } : {}) };
}

export function formatFootballPenalty(display?: FootballPenaltyDisplay) {
  if (!display) return undefined;
  const headline = [display.type, display.team].filter(Boolean).join(" · ");
  const detail = [display.yards !== undefined ? `${display.yards} yards` : undefined, display.detail].filter(Boolean).join(" · ");
  return { headline: headline || "Penalty", detail: detail || undefined };
}
