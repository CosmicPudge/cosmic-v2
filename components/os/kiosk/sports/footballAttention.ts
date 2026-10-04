import type { FootballPlay, FootballPenaltyState } from "@/core/contracts/sports/Football";

export const FOOTBALL_PENALTY_DISPLAY_MS = 7_000;

export interface FootballPenaltyLifecycle {
  identity?: string;
  visibleUntil: number;
  lastHandledIdentity?: string;
}

export function footballPlayIdentity(play?: FootballPlay, penalty?: FootballPenaltyState) {
  if (!play && !penalty) return undefined;
  if (play?.id) return `play:${play.id}`;
  if (play?.sequence !== undefined) return `sequence:${play.sequence}`;
  return `penalty:${play?.period ?? ""}:${play?.clock ?? ""}:${penalty?.teamId ?? play?.teamId ?? ""}:${penalty?.text ?? play?.description ?? ""}`;
}

export function advanceFootballPenaltyLifecycle(state: FootballPenaltyLifecycle, identity: string | undefined, now: number): FootballPenaltyLifecycle {
  if (!identity) return { ...state, identity: undefined, visibleUntil: 0 };
  if (identity !== state.identity && identity !== state.lastHandledIdentity) {
    return { identity, visibleUntil: now + FOOTBALL_PENALTY_DISPLAY_MS, lastHandledIdentity: identity };
  }
  return { ...state, identity, visibleUntil: identity === state.identity ? state.visibleUntil : 0 };
}

export function footballPenaltyIsVisible(state: FootballPenaltyLifecycle, now: number) {
  return Boolean(state.identity && state.identity === state.lastHandledIdentity && state.visibleUntil > now);
}
