import { requireCosmicAccount } from "@/services/auth/server";
import { isCredentialEncryptionConfigured } from "@/services/providers/credentialCrypto";
import { listProviderConnections, setProviderCredentials, upsertProviderConnection } from "@/services/providers/store";
import { getAccountEntitlements } from "@/services/entitlements/service";

function text(value: unknown, name: string, max: number) {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error(`${name} is invalid.`);
  return value.trim();
}

export async function POST(request: Request) {
  try {
    const account = await requireCosmicAccount(request);
    if (!process.env.DATABASE_URL || !isCredentialEncryptionConfigured()) return Response.json({ error: "Account-owned Calendar storage is not configured." }, { status: 503 });
    const body = await request.json() as Record<string, unknown>;
    const serverUrl = text(body.serverUrl, "Server URL", 500);
    const parsed = new URL(serverUrl);
    if (parsed.protocol !== "https:") return Response.json({ error: "Calendar server URL must use HTTPS." }, { status: 400 });
    const username = text(body.username, "Username", 320);
    const password = text(body.password, "App password", 500);
    const displayName = text(body.displayName, "Display name", 120);
    const providerAccountId = `${parsed.origin}:${username}`;
    const existingConnections = await listProviderConnections(account.id);
    const isExisting = existingConnections.some((item) => item.provider === "calendar" && item.providerAccountId === providerAccountId);
    const entitlements = await getAccountEntitlements(account.id);
    if (!isExisting && existingConnections.filter((item) => item.provider === "calendar").length >= 1 && !entitlements.features["calendar.multi_connection"]) return Response.json({ error: "Cosmic+ is required to connect more than one private Calendar." }, { status: 403 });
    const connection = await upsertProviderConnection(account.id, { provider: "calendar", providerType: "caldav", providerAccountId, displayName });
    await setProviderCredentials(account.id, connection.id, { username, password, serverUrl, ...(typeof body.defaultCalendarName === "string" && body.defaultCalendarName.trim() ? { defaultCalendarName: body.defaultCalendarName.trim() } : {}) });
    return Response.json({ connection: { id: connection.id, provider: connection.provider, providerType: connection.providerType, displayName: connection.displayName, status: connection.status } }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: error instanceof Error ? error.message : "Calendar connection failed." }, { status: 400 });
  }
}
