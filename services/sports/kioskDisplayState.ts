import type { SportsEvent } from "@/core/contracts/Sports";

export type KioskDisplayState = "upcoming" | "live" | "complete";

function sessionDurationMs(event: SportsEvent) {
  const label = `${event.title} ${event.metadata?.sessionType ?? ""}`.toLowerCase();
  if (label.includes("race")) return 3 * 60 * 60_000;
  return 2 * 60 * 60_000;
}

export function resolveF1DisplayState(event: SportsEvent, now = new Date()) {
  const scheduledStart = event.start;
  const providerStatus = event.status;
  const explicitlyLive = providerStatus === "live" || providerStatus === "delayed";
  const complete = providerStatus === "final" || providerStatus === "cancelled" || providerStatus === "postponed";
  const boundedEnd = event.end ?? new Date(scheduledStart.getTime() + sessionDurationMs(event));
  const inferredLive = !explicitlyLive && !complete && scheduledStart.getTime() <= now.getTime() && now.getTime() < boundedEnd.getTime();
  const displayState: KioskDisplayState = explicitlyLive || inferredLive ? "live" : complete || now.getTime() >= boundedEnd.getTime() ? "complete" : "upcoming";
  return { providerStatus, scheduledStart, displayState, inferredLive };
}
