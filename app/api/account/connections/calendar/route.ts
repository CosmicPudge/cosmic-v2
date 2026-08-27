import { requireCosmicAccount } from "@/services/auth/server";
import { isCredentialEncryptionConfigured } from "@/services/providers/credentialCrypto";
import { listProviderConnections, setProviderCredentials, upsertProviderConnection } from "@/services/providers/store";
import { getAccountEntitlements } from "@/services/entitlements/service";
import { assertSameOrigin } from "@/services/security/origin";
import { discoverCalDav, discoverCalendars } from "@/services/calendar/caldav";

function text(value: unknown, name: string, max: number) {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error(`${name} is invalid.`);
  return value.trim();
}

function normalizeServerUrl(value: unknown, kind: "icloud" | "caldav") {
  if (kind === "icloud") return "https://caldav.icloud.com";
  const input = text(value, "Server URL", 500);
  const serverUrl = /^[a-z][a-z\d+.-]*:\/\//i.test(input) ? input : `https://${input}`;
  const parsed = new URL(serverUrl);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) throw new Error("Calendar server URL must use HTTPS without embedded credentials.");
  return parsed.toString().replace(/\/$/, "");
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const account = await requireCosmicAccount(request);
    if (!process.env.DATABASE_URL || !isCredentialEncryptionConfigured()) return Response.json({ error: "Account-owned Calendar storage is not configured." }, { status: 503 });
    const body = await request.json() as Record<string, unknown>;
    const kind = body.kind === "icloud" ? "icloud" : "caldav";
    const serverUrl = normalizeServerUrl(body.serverUrl, kind);
    const parsed = new URL(serverUrl);
    const username = text(body.username, "Username", 320);
    const password = text(body.password, "App password", 500);
    const displayName = typeof body.displayName === "string" && body.displayName.trim() ? text(body.displayName, "Display name", 120) : kind === "icloud" ? "iCloud Calendar" : "CalDAV Calendar";
    const providerAccountId = `${parsed.origin}:${username}`;
    const existingConnections = await listProviderConnections(account.id);
    const isExisting = existingConnections.some((item) => item.provider === "calendar" && item.providerAccountId === providerAccountId);
    const entitlements = await getAccountEntitlements(account.id);
    if (!isExisting && existingConnections.filter((item) => item.provider === "calendar" && item.providerType !== "subscription").length >= 1 && !entitlements.features["calendar.multi_connection"]) return Response.json({ error: "Cosmic+ is required to connect more than one private Calendar." }, { status: 403 });
    const discovery = await discoverCalDav({ serverUrl, username, password });
    const calendars = await discoverCalendars({ serverUrl, username, password }, discovery.calendarHomeUrl);
    if (!calendars.length) return Response.json({ error: "No readable calendars were found for this account." }, { status: 422 });
    const connection = await upsertProviderConnection(account.id, { provider: "calendar", providerType: "caldav", providerAccountId, displayName });
    await setProviderCredentials(account.id, connection.id, { username, password, serverUrl, ...(typeof body.defaultCalendarName === "string" && body.defaultCalendarName.trim() ? { defaultCalendarName: body.defaultCalendarName.trim() } : {}) });
    return Response.json({ connection: { id: connection.id, provider: connection.provider, providerType: connection.providerType, displayName: connection.displayName, status: connection.status } }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: error instanceof Error ? error.message : "Calendar connection failed." }, { status: 400 });
  }
}
