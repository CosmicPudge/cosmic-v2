import type { CosmicContextItem, CosmicContextPriority } from "@/core/contracts/Context";

export type DashboardPriority = "critical" | "high" | "normal" | "low";
export type DashboardDaypart = "morning" | "afternoon" | "evening" | "late-night";

export interface DashboardContextCandidate {
  item: CosmicContextItem;
  priority: DashboardPriority;
  score: number;
  reason: string;
}

export interface DashboardContextPlan {
  daypart: DashboardDaypart;
  primary?: DashboardContextCandidate;
  nextUp: DashboardContextCandidate[];
  atAGlance: DashboardContextCandidate[];
  candidates: DashboardContextCandidate[];
}

const priorityScore: Record<DashboardPriority, number> = { critical: 400, high: 300, normal: 200, low: 100 };
const contextPriorityScore: Record<CosmicContextPriority, number> = { critical: 4, attention: 3, glance: 2, passive: 1 };
const sourceOrder = ["calendar", "school", "sports", "finance", "garage", "mail", "clock", "music", "weather", "projects"];

function timeValue(value?: string) {
  const time = value ? Date.parse(value) : Number.POSITIVE_INFINITY;
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
}

export function dashboardDaypart(now = new Date()): DashboardDaypart {
  const hour = now.getHours();
  return hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 22 ? "evening" : "late-night";
}

function classify(item: CosmicContextItem, now: Date): { priority: DashboardPriority; reason: string } {
  const minutesAway = item.startsAt ? Math.round((timeValue(item.startsAt) - now.getTime()) / 60_000) : null;
  if (item.priority === "critical") return { priority: "critical", reason: item.kind === "timer" ? "timer_nearly_done" : "critical_context" };
  if (item.kind === "live-event") return { priority: "high", reason: "sports_live" };
  if (item.source === "school" && item.kind === "assignment" && item.startsAt?.slice(0, 10) === now.toISOString().slice(0, 10)) return { priority: "high", reason: "assignment_due_today" };
  if (item.source === "school" && item.kind === "current-class") return { priority: "high", reason: "class_in_progress" };
  if (item.source === "calendar" && minutesAway !== null && minutesAway <= 60) return { priority: "high", reason: "event_starting_soon" };
  if (item.source === "school" && item.kind === "next-class" && minutesAway !== null && minutesAway <= 60) return { priority: "high", reason: "class_starting_soon" };
  if (item.priority === "attention") return { priority: "high", reason: item.kind === "assignment" ? "academic_attention" : "action_needed" };
  if (item.priority === "glance") return { priority: "normal", reason: "useful_context" };
  return { priority: "low", reason: "background_context" };
}

function stableOrder(item: CosmicContextItem, widgetOrder: string[]) {
  const sourceIndex = sourceOrder.indexOf(item.source);
  const savedIndex = widgetOrder.indexOf(item.source);
  return [savedIndex < 0 ? Number.MAX_SAFE_INTEGER : savedIndex, sourceIndex < 0 ? Number.MAX_SAFE_INTEGER : sourceIndex, item.id] as const;
}

export function rankDashboardContext(items: CosmicContextItem[], options: { now?: Date; widgetOrder?: string[]; maxNextUp?: number } = {}): DashboardContextPlan {
  const now = options.now ?? new Date();
  const widgetOrder = options.widgetOrder ?? [];
  const deduped = new Map<string, CosmicContextItem>();
  for (const item of items) {
    const entityId = item.metadata?.entityId;
    const key = typeof entityId === "string" ? entityId : item.id;
    const current = deduped.get(key);
    if (!current || contextPriorityScore[item.priority] > contextPriorityScore[current.priority]) deduped.set(key, item);
  }
  const candidates = [...deduped.values()].map((item) => {
    const classification = classify(item, now);
    return { item, ...classification, score: priorityScore[classification.priority] };
  }).sort((left, right) => right.score - left.score || timeValue(left.item.startsAt ?? left.item.timestamp) - timeValue(right.item.startsAt ?? right.item.timestamp) || stableOrder(left.item, widgetOrder).join("\u0000").localeCompare(stableOrder(right.item, widgetOrder).join("\u0000")));
  const primary = candidates[0];
  const maxNextUp = options.maxNextUp ?? 4;
  const nextUp = candidates.filter((candidate) => candidate !== primary && candidate.item.startsAt && timeValue(candidate.item.startsAt) >= now.getTime()).sort((left, right) => timeValue(left.item.startsAt) - timeValue(right.item.startsAt) || left.item.id.localeCompare(right.item.id)).slice(0, maxNextUp);
  const atAGlance = candidates.filter((candidate) => candidate !== primary && !nextUp.includes(candidate)).slice(0, 4);
  return { daypart: dashboardDaypart(now), primary, nextUp, atAGlance, candidates };
}

export function dashboardPriorityLabel(priority: DashboardPriority): CosmicContextPriority {
  return priority === "critical" ? "critical" : priority === "high" ? "attention" : priority === "normal" ? "glance" : "passive";
}
