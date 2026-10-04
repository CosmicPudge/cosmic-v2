import { getSportsSnapshot } from "@/services/sports/snapshot";
import { getMLBLiveData } from "@/services/sports/providers/mlb/live";
import { getNFLLiveData } from "@/services/sports/providers/nfl/live";
import { getNBAEventDetail } from "@/services/sports/providers/nba-detail";
import { getCollegeFootballLiveData } from "@/services/sports/providers/college-football-detail";
import { getCurrentCosmicAccount, kioskBootId } from "@/services/auth/server";
import { getAccountPreferences } from "@/services/settings/accountPreferences";
import { referencePreferences } from "@/services/settings/preferences";
import { isDeveloperKioskRequest } from "@/services/kiosk/developerKiosk";
import { sportsDetailPresence } from "@/services/sports/detailDiagnostics";
import { KIOSK_KICKOFF_GRACE_MS } from "@/services/sports/preferences";

export const dynamic = "force-dynamic";

const snapshotCache = new Map<string, { expiresAt: number; value: ReturnType<typeof getSportsSnapshot> }>();
const detailCache = new Map<string, { expiresAt: number; value: Promise<unknown> }>();
const lastGoodFootballDetail = new Map<string, { value: unknown; fetchedAt: string }>();

function cachedSnapshot(key: string, preferences: Parameters<typeof getSportsSnapshot>[1]) {
  const cached = snapshotCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const value = getSportsSnapshot(new Date(), preferences);
  snapshotCache.set(key, { value, expiresAt: Date.now() + 5_000 });
  return value;
}

function mlbGamePk(event: { id: string; metadata?: { gamePk?: string } }) {
  return event.metadata?.gamePk ?? event.id.replace(/^mlb:/, "");
}

function upstreamId(eventId: string) {
  return eventId.split(":").at(-1) ?? eventId;
}

function footballDetailDiagnostics(value: unknown) {
  if (!value || typeof value !== "object") return "detail=false";
  const detail = value as { away?: { score?: unknown; team?: { id?: unknown } }; home?: { score?: unknown; team?: { id?: unknown } }; period?: unknown; clock?: unknown; situation?: { possessionTeamId?: unknown; down?: unknown; distance?: unknown; fieldPosition?: { display?: unknown }; downDistanceText?: unknown }; normalizedPlays?: unknown[]; latestPlay?: unknown; currentDrive?: unknown; venue?: { name?: unknown }; rankings?: unknown[]; stale?: unknown };
  return [`detail=true`, `score=${detail.away?.score ?? "unknown"}-${detail.home?.score ?? "unknown"}`, `period=${detail.period ?? "unknown"}`, `clock=${detail.clock ?? "unknown"}`, `possession=${detail.situation?.possessionTeamId ?? "unknown"}`, `down=${detail.situation?.down ?? "unknown"}`, `distance=${detail.situation?.distance ?? "unknown"}`, `field=${detail.situation?.fieldPosition?.display ?? "unknown"}`, `lastPlay=${Boolean(detail.latestPlay || detail.normalizedPlays?.length)}`, `drive=${Boolean(detail.currentDrive)}`, `rankings=${detail.rankings?.length ?? 0}`, `venue=${detail.venue?.name ? "present" : "unknown"}`, `stale=${Boolean(detail.stale)}`].join(" ");
}

export async function GET(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const eventId = decodeURIComponent((await params).eventId);
  const diagnostics = isDeveloperKioskRequest(request);
  const log = (message: string) => { if (diagnostics) console.info(`[kiosk-sports-detail] event=${eventId} ${message}`); };
  log("request=started");
  const account = await getCurrentCosmicAccount(request, { allowDevice: true, bootId: kioskBootId(request) });
  log(`auth=${account ? "authenticated" : "anonymous"}`);
  const accountKey = account?.id ?? "reference";
  const preferences = account && process.env.DATABASE_URL ? await getAccountPreferences(account.id) : referencePreferences;
  const snapshot = await cachedSnapshot(accountKey, preferences);
  const event = [...snapshot.live, ...snapshot.upcoming, ...snapshot.recent, ...snapshot.featured].find((item) => item.id === eventId);
  if (!event) { log("status=404 success=false reason=event_not_found"); return Response.json({ error: "Sports event was not found." }, { status: 404 }); }

  const cacheKey = `${event.id}:${event.status}`;
  const footballStarting = (event.sport === "nfl" || event.sport === "college-football") && event.status === "scheduled" && Date.now() >= event.start.getTime() && Date.now() <= event.start.getTime() + KIOSK_KICKOFF_GRACE_MS;
  let detail = detailCache.get(cacheKey)?.value;
  if (!detail || (detailCache.get(cacheKey)?.expiresAt ?? 0) <= Date.now()) {
    const requestDetail = event.sport === "mlb" && ["live", "delayed", "final"].includes(event.status)
      ? getMLBLiveData(mlbGamePk(event))
      : event.sport === "nfl" && (["live", "delayed", "suspended", "final"].includes(event.status) || footballStarting)
        ? getNFLLiveData(upstreamId(event.id))
        : event.sport === "nba" && ["pregame", "live", "delayed", "final"].includes(event.status)
        ? getNBAEventDetail(upstreamId(event.id), event.status === "live" || event.status === "delayed" ? 15 : 120)
          : event.sport === "college-football" && (["pregame", "live", "delayed", "suspended", "final"].includes(event.status) || footballStarting)
            ? getCollegeFootballLiveData(upstreamId(event.id))
          : Promise.resolve(null);
    detail = requestDetail.then((value) => {
      if (value && (event.sport === "nfl" || event.sport === "college-football")) lastGoodFootballDetail.set(event.id, { value, fetchedAt: new Date().toISOString() });
      return value;
    }).catch(() => {
      const previous = lastGoodFootballDetail.get(event.id);
      if (!previous) return null;
      return typeof previous.value === "object" && previous.value !== null ? { ...(previous.value as Record<string, unknown>), stale: true, detailUpdatedAt: previous.fetchedAt } : previous.value;
    });
    detailCache.set(cacheKey, { value: detail, expiresAt: Date.now() + (event.status === "live" || event.status === "delayed" || event.status === "suspended" || footballStarting ? 1_500 : 15_000) });
  }

  const live = await detail;
  const presence = sportsDetailPresence(live);
  log(`status=200 providerId=${event.sport === "nfl" || event.sport === "college-football" ? upstreamId(event.id) : "n/a"} ${footballDetailDiagnostics(live)} detailPresence=${presence.detail} ${Object.entries(presence).filter(([key]) => key !== "detail").map(([key, value]) => `${key}=${value}`).join(" ")}`);
  return Response.json({ event, live, providerErrors: snapshot.providerErrors, lastUpdated: snapshot.lastUpdated }, { headers: { "Cache-Control": "no-store" } });
}
