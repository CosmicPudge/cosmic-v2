import { NextResponse } from "next/server";
import { CanvasCalendarProvider } from "@/components/school/data/providers/CanvasCalendarProvider";
import { requireSchoolAccess } from "@/services/school/access";
import { deleteProviderConnection, getProviderCredentials, listProviderConnections, markProviderRefresh, setProviderCredentials, upsertProviderConnection } from "@/services/providers/store";
import { isCredentialEncryptionConfigured } from "@/services/providers/credentialCrypto";
import { assertSameOrigin } from "@/services/security/origin";

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
    return NextResponse.json({ connected: Boolean(connection), status: connection?.status ?? "not_connected", lastSyncedAt: connection?.lastSuccessfulRefreshAt?.toISOString() ?? null });
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
    const result = await new CanvasCalendarProvider(credentials.feedUrl).getDashboardDataWithDiagnostics();
    await markProviderRefresh(account.id, connection.id);
    return NextResponse.json({ data: result.data, diagnostics: result.diagnostics, syncedAt: new Date().toISOString(), assignmentCount: result.data.assignments.length });
  } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Canvas sync failed. Check the feed URL and try again." }, { status: 502 }); }
}
