import type {
  HudPriority,
  HudView,
} from "../hud/types";

export const priorityRank: Record<HudPriority, number> = {
  passive: 0,
  glance: 1,
  attention: 2,
  critical: 3,
};

export function canReplaceView(
  incoming: HudView,
  activePriority: HudPriority,
  isVisible: boolean,
  force = false,
) {
  if (force) {
    return true;
  }

  if (!isVisible) {
    return true;
  }

  return (
    priorityRank[incoming.priority] >=
    priorityRank[activePriority]
  );
}