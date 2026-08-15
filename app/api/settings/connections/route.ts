import { getCalendarSubscriptions } from "@/services/calendar/subscriptionConfig";
import { getGmailToken, isGmailConfigured } from "@/services/mail/gmail";
import { configured as spotifyConfigured, disconnect as disconnectSpotify, readToken as readSpotifyToken } from "@/services/music/spotify";

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

export async function GET() {
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
  const payload: unknown = await request.json().catch(() => null);
  if (typeof payload !== "object" || payload === null || !("provider" in payload) || payload.provider !== "spotify") {
    return Response.json({ error: "Unsupported connection." }, { status: 400 });
  }
  disconnectSpotify();
  return Response.json({ disconnected: true, provider: "spotify" });
}
