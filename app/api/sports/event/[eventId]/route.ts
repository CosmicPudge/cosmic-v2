import { getSportsSnapshot } from "@/services/sports/snapshot";
import { getMLBLiveData } from "@/services/sports/providers/mlb/live";
import { getNFLLiveData } from "@/services/sports/providers/nfl/live";

export const dynamic = "force-dynamic";

let snapshotCache: { expiresAt: number; value: ReturnType<typeof getSportsSnapshot> } | null = null;
const detailCache = new Map<string, { expiresAt: number; value: Promise<unknown> }>();

function cachedSnapshot() {
  if (snapshotCache && snapshotCache.expiresAt > Date.now()) return snapshotCache.value;
  const value = getSportsSnapshot();
  snapshotCache = { value, expiresAt: Date.now() + 5_000 };
  return value;
}

function upstreamId(eventId: string) {
  return eventId.split(":").at(-1) ?? eventId;
}

export async function GET(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const eventId = decodeURIComponent((await params).eventId);
  const snapshot = await cachedSnapshot();
  const event = [...snapshot.live, ...snapshot.upcoming, ...snapshot.recent, ...snapshot.featured].find((item) => item.id === eventId);
  if (!event) return Response.json({ error: "Sports event was not found." }, { status: 404 });

  const cacheKey = `${event.id}:${event.status}`;
  let detail = detailCache.get(cacheKey)?.value;
  if (!detail || (detailCache.get(cacheKey)?.expiresAt ?? 0) <= Date.now()) {
    const requestDetail = event.sport === "mlb" && ["live", "delayed", "final"].includes(event.status)
      ? getMLBLiveData(upstreamId(event.id))
      : event.sport === "nfl" && ["live", "delayed", "final"].includes(event.status)
        ? getNFLLiveData(upstreamId(event.id))
        : Promise.resolve(null);
    detail = requestDetail.catch(() => null);
    detailCache.set(cacheKey, { value: detail, expiresAt: Date.now() + (event.status === "live" || event.status === "delayed" ? 1_500 : 15_000) });
  }

  return Response.json({ event, live: await detail, providerErrors: snapshot.providerErrors, lastUpdated: snapshot.lastUpdated }, { headers: { "Cache-Control": "no-store" } });
}
