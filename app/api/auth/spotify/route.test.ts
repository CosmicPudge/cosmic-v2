import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { GET as startSpotify } from "./route";
import { GET as spotifyCallback } from "./callback/route";
import { getPersonalSpotifyToken } from "@/services/music/spotify";

const key = Buffer.alloc(32, 29).toString("base64");
const env = process.env as Record<string, string | undefined>;

function cookies(response: Response) {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  return (headers.getSetCookie?.() ?? []).map((value) => value.split(";")[0]);
}

test("personal Spotify OAuth starts locally with Spotify-bound S256 PKCE", async () => {
  const previous = { node: env.NODE_ENV, id: env.SPOTIFY_CLIENT_ID, secret: env.SPOTIFY_CLIENT_SECRET, redirect: env.SPOTIFY_REDIRECT_URI };
  env.NODE_ENV = "development";
  env.SPOTIFY_CLIENT_ID = "client-test";
  env.SPOTIFY_CLIENT_SECRET = "secret-test";
  env.SPOTIFY_REDIRECT_URI = "http://localhost:3000/api/auth/spotify/callback";
  try {
    const response = await startSpotify(new Request("http://localhost:3000/api/auth/spotify?returnTo=%2Fmusic"));
    assert.equal(response.status, 302);
    const location = new URL(response.headers.get("location")!);
    assert.equal(location.hostname, "accounts.spotify.com");
    assert.equal(location.searchParams.get("code_challenge_method"), "S256");
    assert.ok(location.searchParams.get("code_challenge"));
    assert.match(location.searchParams.get("scope") ?? "", /user-read-playback-state/);
    assert.match(location.searchParams.get("scope") ?? "", /user-modify-playback-state/);
    assert.ok(cookies(response).some((cookie) => cookie.startsWith("cosmic_oauth_state=")));
    assert.ok(cookies(response).some((cookie) => cookie.startsWith("cosmic_oauth_pkce=")));
  } finally {
    if (previous.node === undefined) delete env.NODE_ENV; else env.NODE_ENV = previous.node;
    if (previous.id === undefined) delete env.SPOTIFY_CLIENT_ID; else env.SPOTIFY_CLIENT_ID = previous.id;
    if (previous.secret === undefined) delete env.SPOTIFY_CLIENT_SECRET; else env.SPOTIFY_CLIENT_SECRET = previous.secret;
    if (previous.redirect === undefined) delete env.SPOTIFY_REDIRECT_URI; else env.SPOTIFY_REDIRECT_URI = previous.redirect;
  }
});

test("personal Spotify callback rejects missing PKCE and stores encrypted credentials on success", async () => {
  const directory = await mkdtemp(join(tmpdir(), "cosmic-spotify-callback-"));
  const previousCwd = process.cwd();
  const previous = { node: env.NODE_ENV, key: env.COSMIC_CREDENTIAL_ENCRYPTION_KEY, id: env.SPOTIFY_CLIENT_ID, secret: env.SPOTIFY_CLIENT_SECRET, redirect: env.SPOTIFY_REDIRECT_URI };
  const previousFetch = globalThis.fetch;
  env.NODE_ENV = "development";
  env.COSMIC_CREDENTIAL_ENCRYPTION_KEY = key;
  env.SPOTIFY_CLIENT_ID = "client-test";
  env.SPOTIFY_CLIENT_SECRET = "secret-test";
  env.SPOTIFY_REDIRECT_URI = "http://localhost:3000/api/auth/spotify/callback";
  let exchanges = 0;
  globalThis.fetch = async () => { exchanges += 1; return new Response(JSON.stringify({ access_token: "personal-access", refresh_token: "personal-refresh", expires_in: 3600 }), { status: 200 }); };
  try {
    process.chdir(directory);
    const start = await startSpotify(new Request("http://localhost:3000/api/auth/spotify?returnTo=%2Fmusic"));
    const startCookies = cookies(start);
    const state = new URL(start.headers.get("location")!).searchParams.get("state")!;
    const missingVerifier = await spotifyCallback(new Request("http://localhost:3000/api/auth/spotify/callback?state=" + encodeURIComponent(state) + "&code=synthetic-code", { headers: { cookie: startCookies[0] } }));
    assert.equal(missingVerifier.status, 400);
    assert.equal(exchanges, 0);
    const callback = await spotifyCallback(new Request("http://localhost:3000/api/auth/spotify/callback?state=" + encodeURIComponent(state) + "&code=synthetic-code", { headers: { cookie: startCookies.join("; ") } }));
    assert.equal(callback.status, 302);
    assert.equal((await getPersonalSpotifyToken())?.access_token, "personal-access");
    const persisted = await readFile(join(directory, ".cosmic", "personal-provider-credentials.json"), "utf8");
    assert.equal(persisted.includes("personal-access"), false);
    assert.equal(persisted.includes("synthetic-code"), false);
  } finally {
    globalThis.fetch = previousFetch;
    process.chdir(previousCwd);
    if (previous.node === undefined) delete env.NODE_ENV; else env.NODE_ENV = previous.node;
    if (previous.key === undefined) delete env.COSMIC_CREDENTIAL_ENCRYPTION_KEY; else env.COSMIC_CREDENTIAL_ENCRYPTION_KEY = previous.key;
    if (previous.id === undefined) delete env.SPOTIFY_CLIENT_ID; else env.SPOTIFY_CLIENT_ID = previous.id;
    if (previous.secret === undefined) delete env.SPOTIFY_CLIENT_SECRET; else env.SPOTIFY_CLIENT_SECRET = previous.secret;
    if (previous.redirect === undefined) delete env.SPOTIFY_REDIRECT_URI; else env.SPOTIFY_REDIRECT_URI = previous.redirect;
    await rm(directory, { recursive: true, force: true });
  }
});
