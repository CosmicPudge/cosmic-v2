import type { SchoolConflict, SchoolEvent } from "@/core/contracts/SchoolIntelligence";

export function detectSourceConflicts(events: SchoolEvent[]): SchoolConflict[] {
  const conflicts: SchoolConflict[] = [];
  const groups = new Map<string, SchoolEvent[]>();
  for (const event of events) {
    const key = event.title.trim().toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  for (const [key, group] of groups) {
    if (group.length < 2) continue;
    const fingerprints = new Set(group.map((event) => `${event.startsAt ?? "unknown"}|${event.location?.name ?? "unknown"}|${event.attire?.value ?? "unknown"}`));
    if (fingerprints.size < 2) continue;
    const factIds = group.flatMap((event) => event.factIds);
    conflicts.push({ id: `school-conflict:${key}`, accountId: group[0].accountId, factIds, description: `Sources disagree about ${group[0].title}.`, status: "open", createdAt: new Date().toISOString() });
  }
  return conflicts;
}
