import { requireCosmicAccount } from "@/services/auth/server";
import { assertSameOrigin } from "@/services/security/origin";
import { isCredentialEncryptionConfigured } from "@/services/providers/credentialCrypto";
import { deleteProviderConnection, getProviderCredentials, listProviderConnections, markProviderRefresh, setProviderCredentials, updateProviderConnection, upsertProviderConnection } from "@/services/providers/store";
import { fetchSubscriptionText, normalizeSubscriptionUrl } from "@/services/calendar/subscriptionSecurity";
import { normalizeCalDavCalendarData } from "@/services/calendar/icalNormalizer";
import type { CalendarEventCategory, CalendarEventPriority } from "@/core/contracts";

export const dynamic = "force-dynamic";
type SubscriptionPayload = { url: string; category: CalendarEventCategory; priority: CalendarEventPriority };

function safeConnection(connection: { id: string; displayName: string | null; status: string; reconnectRequired: boolean; lastSuccessfulRefreshAt: Date | null }) {
  return { id: connection.id, name: connection.displayName ?? "Subscribed Calendar", status: connection.status, enabled: connection.status === "connected", reconnectRequired: connection.reconnectRequired, lastSuccessfulRefreshAt: connection.lastSuccessfulRefreshAt };
}
function text(value: unknown, name: string, max: number) { if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error(`${name} is invalid.`); return value.trim(); }
function parseOptions(body: Record<string, unknown>) { return { category: (body.category === "school" || body.category === "sports" ? body.category : "personal") as CalendarEventCategory, priority: (body.priority === "low" || body.priority === "high" ? body.priority : "normal") as CalendarEventPriority }; }
function wrapIcs(ics: string) { return `<d:response><d:propstat><d:prop><c:calendar-data><![CDATA[${ics}]]></c:calendar-data></d:prop></d:propstat></d:response>`; }
async function preview(url: string, name = "Subscribed Calendar") {
  const normalizedUrl = await normalizeSubscriptionUrl(url);
  const { text: ics } = await fetchSubscriptionText(normalizedUrl);
  if (!/BEGIN:VCALENDAR/i.test(ics)) throw new Error("That link did not return a readable calendar.");
  const start = new Date(); const end = new Date(start); end.setDate(end.getDate() + 90);
  const events = normalizeCalDavCalendarData(wrapIcs(ics), { calendarName: name }, { start, end });
  return { normalizedUrl, eventCount: events.length };
}
async function getSubscriptionConnections(accountId: string) { return (await listProviderConnections(accountId)).filter((connection) => connection.provider === "calendar" && connection.providerType === "subscription"); }

export async function GET(request: Request) {
  try { const account = await requireCosmicAccount(request); if (!isCredentialEncryptionConfigured()) return Response.json({ error: "Calendar subscriptions are not configured." }, { status: 503 }); const connections = await getSubscriptionConnections(account.id); return Response.json({ subscriptions: connections.map(safeConnection) }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { if (error instanceof Response) return error; return Response.json({ error: "Calendar subscriptions are unavailable." }, { status: 503 }); }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request); const account = await requireCosmicAccount(request); if (!process.env.DATABASE_URL || !isCredentialEncryptionConfigured()) return Response.json({ error: "Account-owned Calendar storage is not configured." }, { status: 503 });
    const body = await request.json() as Record<string, unknown>; const url = text(body.url, "Calendar link", 2000);
    if (body.action === "preview") { const result = await preview(url); return Response.json({ preview: { eventCount: result.eventCount } }, { headers: { "Cache-Control": "no-store" } }); }
    const displayName = typeof body.displayName === "string" && body.displayName.trim() ? text(body.displayName, "Calendar name", 120) : "Subscribed Calendar"; const options = parseOptions(body); const result = await preview(url, displayName);
    const connection = await upsertProviderConnection(account.id, { provider: "calendar", providerType: "subscription", providerAccountId: result.normalizedUrl, displayName }); await setProviderCredentials(account.id, connection.id, { url: result.normalizedUrl, ...options }); const refreshed = await markProviderRefresh(account.id, connection.id);
    return Response.json({ subscription: safeConnection(refreshed ?? connection), preview: { eventCount: result.eventCount } }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) { if (error instanceof Response) return error; return Response.json({ error: error instanceof Error ? error.message : "Calendar subscription could not be added." }, { status: 400 }); }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request); const account = await requireCosmicAccount(request); const body = await request.json() as Record<string, unknown>; const id = text(body.id, "Subscription id", 100); const connection = (await getSubscriptionConnections(account.id)).find((item) => item.id === id); if (!connection) return Response.json({ error: "Subscription not found." }, { status: 404 });
    const credentials = await getProviderCredentials<SubscriptionPayload>(account.id, id); if (!credentials?.url) return Response.json({ error: "Subscription credentials are unavailable." }, { status: 409 });
    if (body.refresh === true) { await preview(credentials.url, connection.displayName ?? "Subscribed Calendar"); const refreshed = await markProviderRefresh(account.id, id); return Response.json({ subscription: safeConnection(refreshed ?? connection) }, { headers: { "Cache-Control": "no-store" } }); }
    const changes: { displayName?: string; status?: string; reconnectRequired?: boolean } = {}; if (typeof body.displayName === "string") changes.displayName = text(body.displayName, "Calendar name", 120); if (typeof body.enabled === "boolean") { changes.status = body.enabled ? "connected" : "disabled"; changes.reconnectRequired = false; }
    const updated = await updateProviderConnection(account.id, id, changes); return Response.json({ subscription: safeConnection(updated ?? connection) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { if (error instanceof Response) return error; return Response.json({ error: error instanceof Error ? error.message : "Calendar subscription could not be updated." }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  try { assertSameOrigin(request); const account = await requireCosmicAccount(request); const body = await request.json() as { id?: unknown }; const id = text(body.id, "Subscription id", 100); const connection = (await getSubscriptionConnections(account.id)).find((item) => item.id === id); if (!connection || !(await deleteProviderConnection(account.id, id))) return Response.json({ error: "Subscription not found." }, { status: 404 }); return Response.json({ removed: true }); }
  catch (error) { if (error instanceof Response) return error; return Response.json({ error: "Calendar subscription could not be removed." }, { status: 503 }); }
}
