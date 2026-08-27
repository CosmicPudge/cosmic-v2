import { getCalendarSubscriptions } from "@/services/calendar/subscriptionConfig";
import { getGmailToken, isGmailConfigured } from "@/services/mail/gmail";
import { configured as spotifyConfigured, disconnect as disconnectSpotify, readToken as readSpotifyToken } from "@/services/music/spotify";
import { getCurrentCosmicAccount } from "@/services/auth/server";
import { deleteProviderConnection, listProviderConnections } from "@/services/providers/store";
import { isCredentialEncryptionConfigured } from "@/services/providers/credentialCrypto";
import { clearWritableEventTargets } from "@/services/calendar/writableEventRegistry";
import { normalizeProviderId } from "@/services/providers/normalize";

export const dynamic = "force-dynamic";

function calendarStatus() {
  const subscriptions = getCalendarSubscriptions().filter((item) => item.enabled);
  const appleConfigured = Boolean(
    process.env.APPLE_CALENDAR_USERNAME
    && process.env.APPLE_CALENDAR_PASSWORD,
  );
  const defaultName = process.env.COSMIC_DEFAULT_CALENDAR_NAME;
  const configured = appleConfigured || subscriptions.length > 0;
  return {
    configured,
    connected: configured,
    status: configured ? "configured" : "unavailable",
    provider: appleConfigured ? "Apple Calendar" : subscriptions.length ? "Subscriptions" : "Calendar",
    detail: defaultName
      ? `Default: ${defaultName}`
      : subscriptions.length
        ? `${subscriptions.length} enabled subscription${subscriptions.length === 1 ? "" : "s"}`
        : "No server calendar configured",
  };
}

function unavailableStatus(provider: string, detail: string, available = false) {
  return { configured: available, connected: false, status: available ? "disconnected" : "unavailable", provider, detail } as const;
}

function ownedConnectionStatus(connections: Array<{ provider: string; providerType: string | null; status: string; reconnectRequired: boolean; displayName: string | null }>) {
  const find = (provider: string) => connections.find((connection) => normalizeProviderId(connection.provider) === provider);
  const spotify = find("spotify");
  const gmail = find("gmail");
  const calendar = find("calendar");
  return {
    spotify: spotify ? { configured: true, connected: spotify.status === "connected" && !spotify.reconnectRequired, status: spotify.reconnectRequired ? "reconnect-required" : spotify.status, provider: "Spotify", detail: spotify.displayName ?? "Account-owned Spotify connection" } : unavailableStatus("Spotify", "Not connected", true),
    gmail: gmail ? { configured: true, connected: gmail.status === "connected" && !gmail.reconnectRequired, status: gmail.reconnectRequired ? "reconnect-required" : gmail.status, provider: "Gmail", detail: gmail.displayName ?? "Account-owned Gmail connection" } : unavailableStatus("Gmail", "Not connected", true),
    calendar: calendar ? { configured: true, connected: calendar.status === "connected" && !calendar.reconnectRequired, status: calendar.reconnectRequired ? "reconnect-required" : calendar.status, provider: calendar.providerType === "caldav" ? "Calendar" : "Calendar", detail: calendar.displayName ?? "Account-owned Calendar connection" } : unavailableStatus("Calendar", "Not connected", true),
    outlook: unavailableStatus("Outlook", "Not connected · Coming soon", false),
  };
}

export async function GET(request: Request) {
  const account = await getCurrentCosmicAccount(request);
  if (account && process.env.DATABASE_URL && isCredentialEncryptionConfigured()) {
    const connections = await listProviderConnections(account.id);
    return Response.json(ownedConnectionStatus(connections));
  }
  if (account) return Response.json({ spotify: unavailableStatus("Spotify", "Connection storage unavailable", false), gmail: unavailableStatus("Gmail", "Connection storage unavailable", false), calendar: unavailableStatus("Calendar", "Connection storage unavailable", false), outlook: unavailableStatus("Outlook", "Not connected · Coming soon", false) });
  const spotifyReady = spotifyConfigured();
  const spotifyToken = readSpotifyToken();
  const spotifyReconnectRequired = Boolean(spotifyToken?.expires_at && spotifyToken.expires_at <= Date.now() && !spotifyToken.refresh_token);
  const spotifyConnected = Boolean(spotifyToken) && !spotifyReconnectRequired;
  const gmailReady = isGmailConfigured();
  const gmailToken = getGmailToken();
  const gmailReconnectRequired = Boolean(gmailToken?.expires_at && gmailToken.expires_at <= Date.now() && !gmailToken.refresh_token);
  const gmailConnected = Boolean(gmailToken) && !gmailReconnectRequired;

  return Response.json({
    calendar: calendarStatus(),
    spotify: {
      configured: spotifyReady,
      connected: spotifyConnected,
      status: !spotifyReady ? "unavailable" : spotifyReconnectRequired ? "reconnect-required" : spotifyConnected ? "connected" : "disconnected",
      provider: "Spotify",
      detail: !spotifyReady ? "OAuth is not configured" : spotifyConnected ? "Authorization is stored on this server" : "Ready to connect",
    },
    gmail: {
      configured: gmailReady,
      connected: gmailConnected,
      status: !gmailReady ? "unavailable" : gmailReconnectRequired ? "reconnect-required" : gmailConnected ? "connected" : "disconnected",
      provider: "Gmail",
      detail: !gmailReady ? "OAuth is not configured" : gmailConnected ? "Authorization is stored on this server" : "Ready to connect",
    },
  });
}

export async function DELETE(request: Request) {
  const account = await getCurrentCosmicAccount(request);
  if (account && (!process.env.DATABASE_URL || !isCredentialEncryptionConfigured())) return Response.json({ error: "Account-owned connections are unavailable until durable storage is configured." }, { status: 503 });
  const payload: unknown = await request.json().catch(() => null);
  if (account && process.env.DATABASE_URL && isCredentialEncryptionConfigured()) {
    const connectionId = typeof payload === "object" && payload !== null && "connectionId" in payload && typeof payload.connectionId === "string" ? payload.connectionId : null;
    if (!connectionId) return Response.json({ error: "connectionId is required." }, { status: 400 });
    if (!(await deleteProviderConnection(account.id, connectionId))) return Response.json({ error: "Connection not found." }, { status: 404 });
    clearWritableEventTargets(`${account.id}:${connectionId}`);
    return Response.json({ disconnected: true });
  }
  if (typeof payload !== "object" || payload === null || !("provider" in payload) || payload.provider !== "spotify") {
    return Response.json({ error: "Unsupported connection." }, { status: 400 });
  }
  disconnectSpotify();
  return Response.json({ disconnected: true, provider: "spotify" });
}
