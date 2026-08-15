import type { SportsEvent, SportsEventStatus } from "@/core/contracts/Sports";
import type { SportsProvider, SportsProviderResult } from "./types";
import { date, fetchJson, isRecord, records, string } from "./types";

function status(value: unknown, now: Date, start: Date, end?: Date): SportsEventStatus {
  const statusRecord = isRecord(value) ? value : undefined;
  const type = isRecord(statusRecord?.type) ? statusRecord.type : undefined;
  const state = string(type?.state) ?? string(statusRecord?.state);
  const detail = string(type?.detail) ?? string(statusRecord?.detail);
  const normalized = `${state ?? ""} ${detail ?? ""}`.toLowerCase();
  if (normalized.includes("cancel")) return "cancelled";
  if (normalized.includes("delay")) return "delayed";
  if (state === "in") return "live";
  if (state === "post") return "final";
  if (end && end < now) return "final";
  if (start <= now && (!end || now <= end)) return "live";
  return "scheduled";
}

export class F1Provider implements SportsProvider {
  readonly id = "f1-espn-fallback";
  readonly sport = "f1" as const;
  readonly providerName = "ESPN Formula 1";
  readonly official = false;
  readonly fallback = true;
  readonly sourceUrl = "https://www.espn.com/f1";
  readonly capabilities = { schedule: true, liveScore: true, standings: false, results: true, sessions: false, telemetry: false };
  readonly cacheSeconds = 900;

  async getSnapshot(now: Date): Promise<SportsProviderResult> {
    const payload = await fetchJson(`https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard?limit=1000&dates=${now.getFullYear()}`, this.cacheSeconds);
    const root = isRecord(payload) ? payload : undefined;
    const events = records(root?.events).flatMap((item): SportsEvent[] => {
      const id = string(item.id);
      const start = date(item.date);
      const competition = records(item.competitions)[0];
      const end = competition ? date(competition.endDate) : undefined;
      const title = string(item.name);
      if (!id || !start || !title) return [];
      const venueRecord = competition && isRecord(competition.venue) ? competition.venue : undefined;
      const address = venueRecord && isRecord(venueRecord.address) ? venueRecord.address : undefined;
      const detail = competition && isRecord(competition.status) && isRecord(competition.status.type) ? string(competition.status.type.detail) : undefined;
      return [{
        id: `${this.id}:${id}`,
        sport: "f1",
        title,
        start,
        ...(end ? { end } : {}),
        status: status(competition?.status, now, start, end),
        ...(detail ? { statusDetail: detail } : {}),
        ...(string(venueRecord?.fullName) ? { venue: string(venueRecord?.fullName) } : {}),
        source: "espn",
        metadata: {
          competition: "Formula 1",
          eventName: title,
          ...(string(venueRecord?.fullName) ? { circuit: string(venueRecord?.fullName) } : {}),
          ...(string(address?.country) ? { country: string(address?.country) } : {}),
        },
      }];
    });
    return { events };
  }
}
