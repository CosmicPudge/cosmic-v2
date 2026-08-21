import type { CosmicContextItem, CosmicContextPriority, CosmicContextSnapshot } from "@/core/contracts/Context";

const priorityWeight: Record<CosmicContextPriority, number> = {
  passive: 1,
  glance: 2,
  attention: 3,
  critical: 4,
};

function timeValue(value?: string) {
  const result = value ? Date.parse(value) : Number.POSITIVE_INFINITY;
  return Number.isFinite(result) ? result : Number.POSITIVE_INFINITY;
}

export function isContextItemActive(item: CosmicContextItem, now = new Date()) {
  return !item.expiresAt || timeValue(item.expiresAt) > now.getTime();
}

export function rankContextItems(items: CosmicContextItem[], now = new Date()) {
  return items
    .filter((item) => isContextItemActive(item, now))
    .sort((left, right) => priorityWeight[right.priority] - priorityWeight[left.priority]
      || timeValue(left.startsAt ?? left.timestamp) - timeValue(right.startsAt ?? right.timestamp)
      || left.source.localeCompare(right.source)
      || left.id.localeCompare(right.id));
}

export function buildContextSnapshot(items: CosmicContextItem[], now = new Date()): CosmicContextSnapshot {
  const ranked = rankContextItems(items, now);
  return {
    items: ranked,
    primary: ranked[0],
    secondary: ranked.slice(1, 4),
    passive: ranked.filter((item) => item.priority === "passive").slice(0, 3),
    generatedAt: now.toISOString(),
  };
}

export function dismissContextItem(items: CosmicContextItem[], id: string) {
  return items.filter((item) => item.id !== id);
}
