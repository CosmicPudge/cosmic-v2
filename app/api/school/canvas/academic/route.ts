import { NextResponse } from "next/server";
import { requireSchoolAccess } from "@/services/school/access";
import { assertSameOrigin } from "@/services/security/origin";
import { deleteProviderConnection, getProviderCredentials, listProviderConnections, markProviderRefresh, updateProviderConnection, upsertProviderConnection, setProviderCredentials } from "@/services/providers/store";
import { isCredentialEncryptionConfigured } from "@/services/providers/credentialCrypto";
import { CanvasAcademicProvider, canvasErrorStatus } from "@/services/school/providers/canvas/provider";
import { upsertCanvasAssignments } from "@/services/school/assignmentRepository";

const defaultBaseUrl = "https://usu.instructure.com";
const academicType = "rest";
function connections(accountId: string) { return listProviderConnections(accountId).then((items) => items.filter((item) => item.provider === "canvas" && item.providerType === academicType)); }
function safeStatus(connection: Awaited<ReturnType<typeof listProviderConnections>>[number] | null) { return connection ? { connected: true, status: connection.status, displayName: connection.displayName, email: connection.email, lastSuccessfulRefreshAt: connection.lastSuccessfulRefreshAt } : { connected: false, status: "not_connected" }; }

export async function GET(request: Request) {
  try { const account = await requireSchoolAccess(request); const [connection] = await connections(account.id); return NextResponse.json(safeStatus(connection ?? null), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Canvas academic status is unavailable." }, { status: 503 }); }
}

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request); const account = await requireSchoolAccess(request); if (!isCredentialEncryptionConfigured()) return NextResponse.json({ error: "Canvas connection storage is unavailable." }, { status: 503 });
    const body = await request.json() as Record<string, unknown>; const baseUrl = typeof body.baseUrl === "string" && body.baseUrl.trim() ? body.baseUrl.trim() : defaultBaseUrl; const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!token) return NextResponse.json({ error: "A Canvas personal access token is required." }, { status: 400 });
    const provider = new CanvasAcademicProvider(baseUrl, token); let user;
    try { user = await provider.validate(); } catch (error) { const status = canvasErrorStatus(error); const message = status === "invalid_token" ? "Invalid Canvas token." : status === "forbidden" ? "Canvas denied access." : "Canvas is unavailable."; return NextResponse.json({ error: message, status }, { status: status === "invalid_token" ? 401 : status === "forbidden" ? 403 : 502 }); }
    const connection = await upsertProviderConnection(account.id, { provider: "canvas", providerType: academicType, providerAccountId: `canvas:${new URL(baseUrl).origin}`, displayName: user.name ? `Canvas · ${user.name}` : "Canvas Academic Data" });
    await setProviderCredentials(account.id, connection.id, { baseUrl, token });
    return NextResponse.json({ connection: safeStatus(connection), canvasUser: { id: user.id, name: user.name, shortName: user.short_name } }, { status: 201 });
  } catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Canvas academic connection could not be saved." }, { status: 503 }); }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request); const account = await requireSchoolAccess(request); const [connection] = await connections(account.id); if (!connection) return NextResponse.json({ error: "Canvas Academic Data is not connected." }, { status: 409 });
    const credentials = await getProviderCredentials<{ baseUrl?: unknown; token?: unknown }>(account.id, connection.id); if (typeof credentials?.baseUrl !== "string" || typeof credentials.token !== "string") return NextResponse.json({ error: "Canvas credentials are missing." }, { status: 409 });
    const result = await new CanvasAcademicProvider(credentials.baseUrl, credentials.token).sync(account.id);
    const rows = result.assignments.map((item) => ({ id: item.id, userId: account.id, title: item.title, ...(item.description ? { description: item.description } : {}), ...(item.courseId ? { courseId: item.courseId } : {}), ...(item.courseName ? { courseName: item.courseName } : {}), sourceType: "canvas-api" as const, sourceId: item.sourceId, externalId: item.externalId, ...(item.dueAt ? { dueAt: item.dueAt } : {}), ...(item.availableAt ? { availableAt: item.availableAt } : {}), ...(item.lockAt ? { lockAt: item.lockAt } : {}), completionStatus: item.completionStatus, planningStatus: "not_started" as const, priority: "normal" as const, ...(item.pointsPossible !== undefined ? { pointsPossible: item.pointsPossible } : {}), ...(item.published !== undefined ? { published: item.published } : {}), ...(item.canvasUrl ? { canvasUrl: item.canvasUrl } : {}), provenance: item.provenance, lastSyncedAt: new Date(), ...(item.sourceUpdatedAt ? { sourceUpdatedAt: item.sourceUpdatedAt } : {}) }));
    await upsertCanvasAssignments(rows); await updateProviderConnection(account.id, connection.id, { metadata: { baseUrl: credentials.baseUrl, canvasUserId: result.user.id, courses: result.courses } }); const refreshed = await markProviderRefresh(account.id, connection.id); return NextResponse.json({ synced: true, truncated: result.truncated, courses: result.courses.length, assignments: result.assignments.length, lastSuccessfulRefreshAt: refreshed?.lastSuccessfulRefreshAt ?? new Date() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { if (error instanceof Response) return error; const status = canvasErrorStatus(error); return NextResponse.json({ error: status === "invalid_token" ? "Canvas token is invalid." : status === "forbidden" ? "Canvas access was denied." : "Canvas sync is temporarily unavailable.", status }, { status: status === "invalid_token" ? 401 : status === "forbidden" ? 403 : 502 }); }
}

export async function DELETE(request: Request) {
  try { assertSameOrigin(request); const account = await requireSchoolAccess(request); const [connection] = await connections(account.id); if (!connection || !(await deleteProviderConnection(account.id, connection.id))) return NextResponse.json({ error: "Canvas Academic Data is not connected." }, { status: 404 }); return NextResponse.json({ removed: true }); }
  catch (error) { if (error instanceof Response) return error; return NextResponse.json({ error: "Canvas academic connection could not be removed." }, { status: 503 }); }
}
