import type { SportsEvent, SportsProviderError, SportsSnapshot, SportsSource } from "@/core/contracts/Sports";
import { sportsProviders } from "./providers";
import { favoriteFirstSections, officialSourceReferences, sportOrder } from "./preferences";
import type { CosmicUserPreferences } from "@/core/contracts/Settings";
import { neutralPreferences } from "@/services/settings/preferences";
import { recordCacheMetric } from "@/services/observability/metrics";

function eventDedupeKey(event: SportsEvent): string {
  if ((event.sport === "nfl" || event.sport === "college-football") && event.homeTeam && event.awayTeam) {
    const teams = [event.homeTeam.id ?? event.homeTeam.name, event.awayTeam.id ?? event.awayTeam.name].sort().join("|");
    return `${event.sport}:${event.start.toISOString()}:${teams}`;
  }
  return event.id;
}

const snapshotCache = new Map<string, { expiresAt: number; value: SportsSnapshot }>();
const snapshotRequests = new Map<string, Promise<SportsSnapshot>>();
const MAX_SNAPSHOT_CACHE_ENTRIES = 64;

function snapshotCacheKey(preferences: CosmicUserPreferences): string {
  return JSON.stringify({
    enabledSports: [...preferences.sports.enabledSports].sort(),
    followedTeams: preferences.sports.followedTeams.map((team) => `${team.sport}:${team.provider}:${team.teamId}:${team.label}`).sort(),
    followedDrivers: preferences.sports.followedDrivers.map((driver) => `${driver.sport ?? "f1"}:${driver.id}`).sort(),
    followedConstructors: preferences.sports.followedConstructors.map((constructor) => `${constructor.sport ?? "f1"}:${constructor.id}`).sort(),
  });
}

function snapshotTtl(snapshot: SportsSnapshot): number {
  if (snapshot.live.length) return 5_000;
  if (snapshot.upcoming.length) return 60_000;
  return 5 * 60_000;
}

function trimSnapshotCache() {
  if (snapshotCache.size < MAX_SNAPSHOT_CACHE_ENTRIES) return;
  const oldest = [...snapshotCache.entries()].sort((left, right) => left[1].expiresAt - right[1].expiresAt)[0];
  if (oldest) { snapshotCache.delete(oldest[0]); recordCacheMetric({ cache: "sports.snapshot", event: "evictions" }); }
}

export function dedupeSportsEvents(events: SportsEvent[]): SportsEvent[] {
  const seen = new Set<string>();
  return events.filter((event) => {
    const key = eventDedupeKey(event);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function getSportsSnapshot(now = new Date(), preferences: CosmicUserPreferences = neutralPreferences): Promise<SportsSnapshot> {
  const cacheKey = snapshotCacheKey(preferences);
  const cached = snapshotCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) { recordCacheMetric({ cache: "sports.snapshot", event: "hits" }); return cached.value; }
  recordCacheMetric({ cache: "sports.snapshot", event: "misses" });
  const pending = snapshotRequests.get(cacheKey);
  if (pending) { recordCacheMetric({ cache: "sports.snapshot", event: "coalesced" }); return pending; }

  const request = loadSportsSnapshot(now, preferences).then((snapshot) => {
    recordCacheMetric({ cache: "sports.snapshot", event: "refreshes" });
    trimSnapshotCache();
    snapshotCache.set(cacheKey, { value: snapshot, expiresAt: Date.now() + snapshotTtl(snapshot) });
    return snapshot;
  }).catch((error) => {
    recordCacheMetric({ cache: "sports.snapshot", event: "failures" });
    throw error;
  }).finally(() => {
    snapshotRequests.delete(cacheKey);
  });
  snapshotRequests.set(cacheKey, request);
  return request;
}

async function loadSportsSnapshot(now: Date, preferences: CosmicUserPreferences): Promise<SportsSnapshot> {
  const providers = sportsProviders(preferences);
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

  const normalized = dedupeSportsEvents(events).filter((event) => eventMatchesSportsPreferences(event, preferences));
  const sections = favoriteFirstSections(normalized, preferences);
  const live = sections.now;
  const upcoming = sections.next;
  const recent = sections.recent;
  const featured: SportsEvent[] = [];
  for (const sport of sportOrder) {
    const event = live.find((item) => item.sport === sport) ?? upcoming.find((item) => item.sport === sport) ?? recent.find((item) => item.sport === sport);
    if (event) featured.push(event);
  }

  return { live, upcoming, recent, featured, standings, providerErrors, sources, lastUpdated: now };
}

function eventMatchesSportsPreferences(event: SportsEvent, preferences: CosmicUserPreferences) {
  return preferences.sports.enabledSports.includes(event.sport);
}
