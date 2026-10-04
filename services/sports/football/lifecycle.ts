import type { SportsEvent } from "@/core/contracts/Sports";
type FootballDetail = { state?: string; statusText?: string };

export type FootballLifecycleState =
  | "upcoming"
  | "pregame"
  | "starting"
  | "live"
  | "halftime"
  | "overtime"
  | "delayed"
  | "postponed"
  | "suspended"
  | "final"
  | "postgame";

/** Automatic football presentation begins 30 minutes before a followed kickoff. */
export const FOOTBALL_PREGAME_WINDOW_MS = 30 * 60_000;
/** Final stays on the kiosk for four minutes, then returns to slideshow selection. */
export const FOOTBALL_FINAL_HOLD_MS = 4 * 60_000;

function text(value?: unknown) { return typeof value === "string" ? value.toLowerCase() : ""; }

export function providerFootballState(value?: unknown): FootballLifecycleState | undefined {
  const state = text(value);
  if (!state) return undefined;
  if (state.includes("postpon")) return "postponed";
  if (state.includes("suspend")) return "suspended";
  if (state.includes("delay")) return "delayed";
  if (state.includes("half")) return "halftime";
  if (state.includes("overtime") || /\b\d+ot\b/.test(state) || /\bot\b/.test(state)) return "overtime";
  if (state.includes("end of") || state.includes("end period") || state.includes("end 1") || state.includes("end 3")) return "live";
  if (state.includes("final") || state.includes("complete") || state === "post") return "final";
  if (state.includes("live") || state.includes("progress") || state === "in" || state.includes("quarter")) return "live";
  if (state.includes("pregame")) return "pregame";
  if (state.includes("scheduled") || state.includes("pre")) return "upcoming";
  return undefined;
}

export function footballFinalHoldUntil(event: SportsEvent): number | undefined {
  const value = event.metadata?.finalizedAt;
  if (!value) return undefined;
  const finalizedAt = Date.parse(value);
  return Number.isFinite(finalizedAt) ? finalizedAt + FOOTBALL_FINAL_HOLD_MS : undefined;
}

export function resolveFootballLifecycle(event: SportsEvent, detail?: FootballDetail, now = new Date()): FootballLifecycleState {
  const detailState = providerFootballState(
    detail && "state" in detail ? detail.state : undefined,
  ) ?? providerFootballState(
    detail && "statusText" in detail ? detail.statusText : undefined,
  );

  if (detailState && detailState !== "upcoming") {
    return detailState;
  }
  const eventState = providerFootballState(event.statusDetail);
  if (eventState && eventState !== "upcoming" && event.status !== "final") return eventState;
  if (event.status === "postponed") return "postponed";
  if (event.status === "suspended") return "suspended";
  if (event.status === "delayed") return "delayed";
  if (event.status === "final") return footballFinalHoldUntil(event) && now.getTime() < footballFinalHoldUntil(event)! ? "final" : "postgame";
  if (event.status === "live") return "live";
  if (now.getTime() < event.start.getTime()) return event.start.getTime() - now.getTime() <= FOOTBALL_PREGAME_WINDOW_MS ? "pregame" : "upcoming";
  return now.getTime() <= event.start.getTime() + 45 * 60_000 ? "starting" : "postgame";
}

export function footballCountdownLabel(event: SportsEvent, now = new Date()) {
  const seconds = Math.max(0, Math.ceil((event.start.getTime() - now.getTime()) / 1000));
  if (seconds >= 60) return `KICKOFF IN ${Math.ceil(seconds / 60)} MIN`;
  return `KICKOFF IN ${seconds} SEC`;
}

export function isFootballActiveLifecycle(state: FootballLifecycleState) {
  return ["live", "halftime", "overtime", "delayed", "suspended", "final"].includes(state);
}
