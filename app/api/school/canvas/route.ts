import { NextResponse } from "next/server";
import { fetchCanvasCalendarEvents } from "@/components/school/data/providers/CanvasCalendarProvider";
import { buildDashboard } from "@/components/school/data/engine/engine";
import { requireSchoolAccess } from "@/services/school/access";
import { deleteProviderConnection, getProviderCredentials, listProviderConnections, markProviderRefresh, setProviderCredentials, updateProviderConnection, upsertProviderConnection } from "@/services/providers/store";
import { isCredentialEncryptionConfigured } from "@/services/providers/credentialCrypto";
import { assertSameOrigin } from "@/services/security/origin";
import { persistCanvasCalendarEvents } from "@/services/school/providers/canvas/calendarSync";

export const dynamic = "force-dynamic";
const providerAccountId = "canvas-personal-calendar";

function validFeedUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2_048) return false;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}

async function canvasConnection(userId: string) {
  return (await listProviderConnections(userId)).find((item) => item.provider === "canvas" && item.providerAccountId === providerAccountId) ?? null;
}

export async function GET(request: Request) {
  try {
    const account = await requireSchoolAccess(request);
    if (!isCredentialEncryptionConfigured()) return NextResponse.json({ error: "Canvas connection storage is unavailable." }, { status: 503 });
    const connection = await canvasConnection(account.id);
    const metadata = connection?.metadata && typeof connection.metadata === "object" ? connection.metadata as { lastCalendarSync?: unknown } : {};
    return NextResponse.json({ connected: Boolean(connection), status: connection?.status ?? "not_connected", lastSyncedAt: connection?.lastSuccessfulRefreshAt?.toISOString() ?? null, lastCalendarSync: metadata.lastCalendarSync ?? null });
  } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Canvas connection status is unavailable." }, { status: 503 }); }
}

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const account = await requireSchoolAccess(request);
    if (!isCredentialEncryptionConfigured()) return NextResponse.json({ error: "Canvas connection storage is unavailable." }, { status: 503 });
    const body = await request.json().catch(() => null) as { feedUrl?: unknown } | null;
    if (!validFeedUrl(body?.feedUrl)) return NextResponse.json({ error: "Enter the HTTPS Canvas Calendar Feed URL." }, { status: 400 });
    const connection = await upsertProviderConnection(account.id, { provider: "canvas", providerType: "ical", providerAccountId, displayName: "Canvas" });
    await setProviderCredentials(account.id, connection.id, { feedUrl: body.feedUrl });
    return NextResponse.json({ connected: true, status: "connected" });
  } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Canvas connection could not be saved." }, { status: 503 }); }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const account = await requireSchoolAccess(request);
    const connection = await canvasConnection(account.id);
    if (connection) await deleteProviderConnection(account.id, connection.id);
    return NextResponse.json({ disconnected: true });
  } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Canvas connection could not be removed." }, { status: 503 }); }
}

export async function POST(request: Request) {
  try {
    const account = await requireSchoolAccess(request);
    if (!isCredentialEncryptionConfigured()) return NextResponse.json({ error: "Canvas connection storage is unavailable." }, { status: 503 });
    const connection = await canvasConnection(account.id);
    if (!connection) return NextResponse.json({ error: "Canvas is not connected." }, { status: 409 });
    const credentials = await getProviderCredentials<{ feedUrl?: unknown }>(account.id, connection.id);
    if (!validFeedUrl(credentials?.feedUrl)) return NextResponse.json({ error: "Canvas feed URL is missing or invalid." }, { status: 409 });
    const parsed = await fetchCanvasCalendarEvents(credentials.feedUrl);
    const sync = await persistCanvasCalendarEvents(account.id, connection.id, parsed);
    await markProviderRefresh(account.id, connection.id);
    await updateProviderConnection(account.id, connection.id, { metadata: { lastCalendarSync: { eventsSeen: sync.eventsSeen, created: sync.created, updated: sync.updated, unchanged: sync.unchanged, unmatched: sync.unmatched, missing: sync.missing } } });
    return NextResponse.json({ data: buildDashboard(parsed.events), diagnostics: { ...parsed.diagnostics, ...sync }, syncedAt: new Date().toISOString(), assignmentCount: sync.created + sync.updated });
  } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Canvas sync failed. Check the feed URL and try again." }, { status: 502 }); }
}
