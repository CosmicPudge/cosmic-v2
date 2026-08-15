import type { SportKind, SportsEvent, SportsProviderError, SportsSnapshot, SportsSource } from "@/core/contracts/Sports";
import { sportsProviders } from "./providers";
import { officialSourceReferences, sportsPreferences } from "./preferences";

function byStart(first: SportsEvent, second: SportsEvent): number {
  return first.start.getTime() - second.start.getTime();
}

function isLive(event: SportsEvent): boolean {
  return event.status === "live" || event.status === "delayed";
}

function isRecent(event: SportsEvent): boolean {
  return event.status === "final" || event.status === "cancelled" || event.status === "postponed";
}

function unique(events: SportsEvent[]): SportsEvent[] {
  const seen = new Set<string>();
  return events.filter((event) => {
    if (seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });
}

export async function getSportsSnapshot(now = new Date()): Promise<SportsSnapshot> {
  const providers = sportsProviders();
  const results = await Promise.all(providers.map(async (provider) => {
    try {
      return { provider, result: await provider.getSnapshot(now) };
    } catch (error) {
      return { provider, error };
    }
  }));
  const events: SportsEvent[] = [];
  const standings: SportsSnapshot["standings"] = {};
  const providerErrors: SportsProviderError[] = [];
  const sources: SportsSource[] = [...officialSourceReferences];

  for (const item of results) {
    if ("result" in item && item.result) {
      events.push(...item.result.events.map((event) => ({
        ...event,
        provider: item.provider.id,
        providerName: item.provider.providerName,
        official: item.provider.official,
        fallback: item.provider.fallback,
        ...(item.provider.sourceUrl ? { sourceUrl: item.provider.sourceUrl } : {}),
      })));
      if (item.result.standings?.length) standings[item.provider.sport] = item.result.standings;
      sources.push({ id: item.provider.id, sport: item.provider.sport, providerName: item.provider.providerName, official: item.provider.official, fallback: item.provider.fallback, status: item.provider.fallback ? "fallback" : "ok", capabilities: item.provider.capabilities, cacheSeconds: item.provider.cacheSeconds, ...(item.provider.sourceUrl ? { sourceUrl: item.provider.sourceUrl } : {}) });
      continue;
    }
    const message = item.error instanceof Error ? item.error.message : "Provider request failed";
    console.warn(`Sports provider ${item.provider.id} failed: ${message}`);
    providerErrors.push({ sport: item.provider.sport, provider: item.provider.id, message });
    sources.push({ id: item.provider.id, sport: item.provider.sport, providerName: item.provider.providerName, official: item.provider.official, fallback: item.provider.fallback, status: "unavailable", capabilities: item.provider.capabilities, cacheSeconds: item.provider.cacheSeconds, ...(item.provider.sourceUrl ? { sourceUrl: item.provider.sourceUrl } : {}) });
  }

  const normalized = unique(events);
  const live = normalized.filter(isLive).sort(byStart);
  const upcoming = normalized.filter((event) => !isLive(event) && !isRecent(event)).sort(byStart);
  const recent = normalized.filter((event) => !isLive(event) && isRecent(event)).sort((first, second) => second.start.getTime() - first.start.getTime());
  const featured: SportsEvent[] = [];
  for (const sport of sportsPreferences.sportOrder) {
    const event = live.find((item) => item.sport === sport) ?? upcoming.find((item) => item.sport === sport) ?? recent.find((item) => item.sport === sport);
    if (event) featured.push(event);
  }

  return { live, upcoming, recent, featured, standings, providerErrors, sources, lastUpdated: now };
}
