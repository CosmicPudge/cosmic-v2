import "server-only";

import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import type { MusicArtist, MusicCapabilities, MusicSnapshot } from "@/core/contracts/Music";
import { getProviderCredentials, listProviderConnections, markProviderReconnectRequired, setProviderCredentials, upsertProviderConnection } from "@/services/providers/store";
import { normalizeProviderId } from "@/services/providers/normalize";

export type Token = { access_token: string; refresh_token?: string; expires_at?: number; scope?: string };
const path = join(process.cwd(), ".cosmic", "spotify-token.json");
const caps: MusicCapabilities = { canPlay: true, canPause: true, canSkipNext: true, canSkipPrevious: true, canSeek: true, canSetVolume: true, canReadQueue: true };
const disabledCaps: MusicCapabilities = { canPlay: false, canPause: false, canSkipNext: false, canSkipPrevious: false, canSeek: false, canSetVolume: false, canReadQueue: false };
const ARTIST_CACHE_MS = 60 * 60 * 1000;
const artistCache = new Map<string, { profile?: MusicArtist; expiresAt: number }>();
const artistRequests = new Map<string, Promise<Map<string, MusicArtist>>>();

export const configured = () => Boolean(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET && process.env.SPOTIFY_REDIRECT_URI);
export const readToken = (): Token | undefined => { try { return JSON.parse(readFileSync(path, "utf8")) as Token; } catch { return undefined; } };
export const storeToken = (token: Token) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, JSON.stringify({ ...readToken(), ...token, refresh_token: token.refresh_token ?? readToken()?.refresh_token }), { mode: 0o600 }); };
export const disconnect = () => { if (existsSync(path)) unlinkSync(path); };

function selectSpotifyArtwork(images?: Array<{ url: string; width?: number; height?: number }>) { return images?.slice().sort((a, b) => Math.abs((a.width ?? 640) - 640) - Math.abs((b.width ?? 640) - 640))[0]?.url; }
function selectSpotifyArtistImage(images?: Array<{ url: string; width?: number; height?: number }>) { return images?.slice().sort((a, b) => Math.abs((a.width ?? 160) - 160) - Math.abs((b.width ?? 160) - 160))[0]?.url; }
function emptyPlayback() { return { playing: false, positionMs: 0, updatedAt: "" }; }
function disconnected(error: string): MusicSnapshot { return { connected: false, capabilities: disabledCaps, playback: emptyPlayback(), error }; }
function temporaryFailure(error: string): MusicSnapshot { return { provider: "spotify", connected: true, capabilities: caps, playback: { ...emptyPlayback(), updatedAt: new Date().toISOString() }, error }; }

async function refreshToken(current: Token) {
  if (!current.refresh_token) throw new Error("Spotify authorization needs to reconnect.");
  const response = await fetch("https://accounts.spotify.com/api/token", { method: "POST", headers: { Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: current.refresh_token }) });
  if (!response.ok) throw new Error("Spotify authorization needs to reconnect.");
  const next = await response.json() as Token & { expires_in: number };
  return { ...current, ...next, expires_at: Date.now() + next.expires_in * 1000, refresh_token: next.refresh_token ?? current.refresh_token };
}

async function accountToken(userId: string, connectionId: string, current: Token) {
  if (!current.expires_at || current.expires_at > Date.now() + 60_000) return current;
  const next = await refreshToken(current);
  await setProviderCredentials(userId, connectionId, next as Record<string, unknown>);
  return next;
}

async function token() {
  const current = readToken();
  if (!current) throw new Error("Spotify reconnect required.");
  if (!current.expires_at || current.expires_at > Date.now() + 60_000) return current;
  const next = await refreshToken(current);
  storeToken(next);
  return next;
}

async function getArtistProfiles(ids: string[], accessToken: string): Promise<Map<string, MusicArtist>> {
  const uniqueIds = [...new Set(ids)].filter(Boolean);
  const now = Date.now();
  const profiles = new Map<string, MusicArtist>();
  const missing = uniqueIds.filter((id) => {
    const cached = artistCache.get(id);
    if (cached && cached.expiresAt > now) {
      if (cached.profile) profiles.set(id, cached.profile);
      return false;
    }
    return true;
  });
  if (!missing.length) return profiles;
  const requestKey = missing.slice().sort().join(",");
  const pending = artistRequests.get(requestKey);
  const request = pending ?? (async () => {
    const result = new Map<string, MusicArtist>();
    try {
      const response = await fetch(`https://api.spotify.com/v1/artists?ids=${encodeURIComponent(missing.join(","))}`, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!response.ok) return result;
      const payload = await response.json() as { artists?: Array<{ id: string; name: string; images?: Array<{ url: string; width?: number; height?: number }> | null } | null> };
      for (const artist of payload.artists ?? []) {
        if (!artist?.id || !artist.name) continue;
        const profile = { id: artist.id, name: artist.name, imageUrl: selectSpotifyArtistImage(artist.images ?? undefined) } satisfies MusicArtist;
        result.set(artist.id, profile);
      }
    } catch { /* Artist imagery is an enhancement; track playback remains usable. */ }
    return result;
  })();
  artistRequests.set(requestKey, request);
  const fetched = await request.finally(() => { if (artistRequests.get(requestKey) === request) artistRequests.delete(requestKey); });
  for (const id of missing) artistCache.set(id, { profile: fetched.get(id), expiresAt: now + ARTIST_CACHE_MS });
  for (const [id, profile] of fetched) profiles.set(id, profile);
  return profiles;
}

async function normalizePlayback(data: { is_playing: boolean; progress_ms: number; item?: { id: string; name: string; duration_ms: number; artists: { id?: string; name: string }[]; album?: { name: string; images?: { url: string; width?: number; height?: number }[] } }; device?: { name: string; volume_percent?: number } }, accessToken: string): Promise<MusicSnapshot> {
  const profiles = data.item ? await getArtistProfiles(data.item.artists.map((artist) => artist.id ?? ""), accessToken) : new Map<string, MusicArtist>();
  const artistProfiles = data.item?.artists.map((artist) => artist.id ? profiles.get(artist.id) ?? { id: artist.id, name: artist.name } : { name: artist.name });
  return { provider: "spotify", connected: true, capabilities: caps, playback: { playing: data.is_playing, positionMs: data.progress_ms ?? 0, durationMs: data.item?.duration_ms, volume: data.device?.volume_percent, deviceName: data.device?.name, updatedAt: new Date().toISOString(), track: data.item ? { id: data.item.id, title: data.item.name, artists: data.item.artists.map((artist) => artist.name), ...(artistProfiles?.length ? { artistProfiles } : {}), album: data.item.album?.name, artworkUrl: selectSpotifyArtwork(data.item.album?.images), durationMs: data.item.duration_ms, provider: "spotify" } : undefined } };
}

async function snapshotWithToken(current: Token): Promise<MusicSnapshot> {
  try {
    const response = await fetch("https://api.spotify.com/v1/me/player", { headers: { Authorization: `Bearer ${current.access_token}` } });
    if (response.status === 204) return { provider: "spotify", connected: true, capabilities: caps, playback: { playing: false, positionMs: 0, updatedAt: new Date().toISOString() } };
    if (response.status === 401) return disconnected("Spotify authorization needs to reconnect.");
    if (response.status === 429) return temporaryFailure("Spotify is rate limited. Retrying automatically.");
    if (response.status >= 500) return temporaryFailure("Spotify is temporarily unavailable. Retrying automatically.");
    if (!response.ok) return temporaryFailure("Spotify playback is temporarily unavailable.");
    return await normalizePlayback(await response.json() as Parameters<typeof normalizePlayback>[0], current.access_token);
  } catch { return temporaryFailure("Spotify playback is temporarily unavailable."); }
}

export async function snapshot(): Promise<MusicSnapshot> {
  if (!configured()) return disconnected("Spotify is not configured on this server.");
  try { return await snapshotWithToken(await token()); } catch (error) { return disconnected(error instanceof Error ? error.message : "Spotify authorization needs to reconnect."); }
}

export async function exchange(code: string) {
  const response = await fetch("https://accounts.spotify.com/api/token", { method: "POST", headers: { Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: process.env.SPOTIFY_REDIRECT_URI ?? "" }) });
  if (!response.ok) throw new Error("Spotify authorization failed.");
  const data = await response.json() as Token & { expires_in: number };
  return { ...data, expires_at: Date.now() + data.expires_in * 1000 };
}

export async function storeAccountToken(userId: string, current: Token) {
  const profileResponse = await fetch("https://api.spotify.com/v1/me", { headers: { Authorization: `Bearer ${current.access_token}` } });
  if (!profileResponse.ok) throw new Error("Spotify account identity could not be verified.");
  const profile = await profileResponse.json() as { id: string; display_name?: string; email?: string };
  const connection = await upsertProviderConnection(userId, { provider: "spotify", providerAccountId: profile.id, displayName: profile.display_name, email: profile.email });
  await setProviderCredentials(userId, connection.id, current as Record<string, unknown>);
  return connection;
}

export async function accountTokenValue(userId: string, connectionId: string) { return getProviderCredentials<Token>(userId, connectionId); }

async function ownedToken(userId: string) {
  const connection = (await listProviderConnections(userId)).find((item) => normalizeProviderId(item.provider) === "spotify");
  if (!connection || connection.status !== "connected" || connection.reconnectRequired) return null;
  const current = await getProviderCredentials<Token>(userId, connection.id);
  if (!current) return null;
  try { return { token: await accountToken(userId, connection.id, current), connection }; } catch { await markProviderReconnectRequired(userId, connection.id); return null; }
}

export async function accountSnapshot(userId: string): Promise<MusicSnapshot> {
  if (!configured()) return disconnected("Spotify is not configured on this server.");
  const owned = await ownedToken(userId);
  if (!owned) return disconnected("Spotify is not connected to this Cosmic account.");
  const result = await snapshotWithToken(owned.token);
  if (!result.connected && /authorization needs/i.test(result.error ?? "")) await markProviderReconnectRequired(userId, owned.connection.id);
  return result;
}

async function actionWithToken(current: Token, name: "play" | "pause" | "next" | "previous" | "seek" | "volume", value?: number) {
  const paths = { play: ["PUT", "/me/player/play"], pause: ["PUT", "/me/player/pause"], next: ["POST", "/me/player/next"], previous: ["POST", "/me/player/previous"], seek: ["PUT", `/me/player/seek?position_ms=${value}`], volume: ["PUT", `/me/player/volume?volume_percent=${value}`] } as const;
  const [method, pathName] = paths[name];
  const response = await fetch(`https://api.spotify.com/v1${pathName}`, { method, headers: { Authorization: `Bearer ${current.access_token}` } });
  if (!response.ok) { if (response.status === 404) throw new Error("Spotify playback control requires an active Spotify device."); if (response.status === 403) throw new Error("Spotify playback control is unavailable for this account."); throw new Error("Spotify could not complete that playback action."); }
}

export async function accountAction(userId: string, name: "play" | "pause" | "next" | "previous" | "seek" | "volume", value?: number) { const owned = await ownedToken(userId); if (!owned) throw new Error("Spotify is not connected to this Cosmic account."); return actionWithToken(owned.token, name, value); }
export async function action(name: "play" | "pause" | "next" | "previous" | "seek" | "volume", value?: number) { return actionWithToken(await token(), name, value); }
