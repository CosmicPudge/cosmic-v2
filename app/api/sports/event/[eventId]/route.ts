import { getSportsSnapshot } from "@/services/sports/snapshot";
import { getMLBLiveData } from "@/services/sports/providers/mlb/live";
import { getNFLLiveData } from "@/services/sports/providers/nfl/live";
import { getNBAEventDetail } from "@/services/sports/providers/nba-detail";
import { getCurrentCosmicAccount } from "@/services/auth/server";
import { getAccountPreferences } from "@/services/settings/accountPreferences";
import { referencePreferences } from "@/services/settings/preferences";

export const dynamic = "force-dynamic";

const snapshotCache = new Map<string, { expiresAt: number; value: ReturnType<typeof getSportsSnapshot> }>();
const detailCache = new Map<string, { expiresAt: number; value: Promise<unknown> }>();

function cachedSnapshot(key: string, preferences: Parameters<typeof getSportsSnapshot>[1]) {
  const cached = snapshotCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const value = getSportsSnapshot(new Date(), preferences);
  snapshotCache.set(key, { value, expiresAt: Date.now() + 5_000 });
  return value;
}

function upstreamId(eventId: string) {
  return eventId.split(":").at(-1) ?? eventId;
}

export async function GET(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const eventId = decodeURIComponent((await params).eventId);
  const account = await getCurrentCosmicAccount(request);
  const accountKey = account?.id ?? "reference";
  const preferences = account && process.env.DATABASE_URL ? await getAccountPreferences(account.id) : referencePreferences;
  const snapshot = await cachedSnapshot(accountKey, preferences);
  const event = [...snapshot.live, ...snapshot.upcoming, ...snapshot.recent, ...snapshot.featured].find((item) => item.id === eventId);
  if (!event) return Response.json({ error: "Sports event was not found." }, { status: 404 });

  const cacheKey = `${event.id}:${event.status}`;
  let detail = detailCache.get(cacheKey)?.value;
  if (!detail || (detailCache.get(cacheKey)?.expiresAt ?? 0) <= Date.now()) {
    const requestDetail = event.sport === "mlb" && ["live", "delayed", "final"].includes(event.status)
      ? getMLBLiveData(upstreamId(event.id))
      : event.sport === "nfl" && ["live", "delayed", "final"].includes(event.status)
        ? getNFLLiveData(upstreamId(event.id))
        : event.sport === "nba" && ["pregame", "live", "delayed", "final"].includes(event.status)
          ? getNBAEventDetail(upstreamId(event.id), event.status === "live" || event.status === "delayed" ? 15 : 120)
          : Promise.resolve(null);
    detail = requestDetail.catch(() => null);
    detailCache.set(cacheKey, { value: detail, expiresAt: Date.now() + (event.status === "live" || event.status === "delayed" ? 1_500 : 15_000) });
  }

  return Response.json({ event, live: await detail, providerErrors: snapshot.providerErrors, lastUpdated: snapshot.lastUpdated }, { headers: { "Cache-Control": "no-store" } });
}
