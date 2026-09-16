import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { exchange, getPersonalSpotifyToken, personalAction, personalSnapshotWithDiagnostics, refreshPersonalSpotifyToken, storePersonalSpotifyToken } from "./spotify";

const key = Buffer.alloc(32, 23).toString("base64");
const env = process.env as Record<string, string | undefined>;

test("Spotify exchange accepts a server-held PKCE verifier and preserves minimal playback scopes", async () => {
  const previous = { id: env.SPOTIFY_CLIENT_ID, secret: env.SPOTIFY_CLIENT_SECRET, redirect: env.SPOTIFY_REDIRECT_URI };
  const previousFetch = globalThis.fetch;
  env.SPOTIFY_CLIENT_ID = "client-test";
  env.SPOTIFY_CLIENT_SECRET = "secret-test";
  env.SPOTIFY_REDIRECT_URI = "http://localhost:3000/api/auth/spotify/callback";
  let body = "";
  globalThis.fetch = async (_input, init) => { body = String(init?.body ?? ""); return new Response(JSON.stringify({ access_token: "synthetic-access", refresh_token: "synthetic-refresh", expires_in: 3600 }), { status: 200 }); };
  try {
    const token = await exchange("synthetic-code", "synthetic-verifier");
    assert.equal(token.access_token, "synthetic-access");
    assert.equal(new URLSearchParams(body).get("code_verifier"), "synthetic-verifier");
    assert.match(body, /grant_type=authorization_code/);
  } finally {
    globalThis.fetch = previousFetch;
    if (previous.id === undefined) delete env.SPOTIFY_CLIENT_ID; else env.SPOTIFY_CLIENT_ID = previous.id;
    if (previous.secret === undefined) delete env.SPOTIFY_CLIENT_SECRET; else env.SPOTIFY_CLIENT_SECRET = previous.secret;
    if (previous.redirect === undefined) delete env.SPOTIFY_REDIRECT_URI; else env.SPOTIFY_REDIRECT_URI = previous.redirect;
  }
});

test("personal Spotify credentials use only the encrypted personal namespace", async () => {
  const directory = await mkdtemp(join(tmpdir(), "cosmic-spotify-store-"));
  const previousCwd = process.cwd();
  const previousKey = env.COSMIC_CREDENTIAL_ENCRYPTION_KEY;
  env.COSMIC_CREDENTIAL_ENCRYPTION_KEY = key;
  try {
    process.chdir(directory);
    await storePersonalSpotifyToken({ access_token: "personal-access", refresh_token: "personal-refresh", scope: "user-read-playback-state" });
    assert.equal((await getPersonalSpotifyToken())?.access_token, "personal-access");
    const persisted = await readFile(join(directory, ".cosmic", "personal-provider-credentials.json"), "utf8");
    assert.equal(persisted.includes("personal-access"), false);
    assert.equal(persisted.includes("personal-refresh"), false);
  } finally {
    process.chdir(previousCwd);
    if (previousKey === undefined) delete env.COSMIC_CREDENTIAL_ENCRYPTION_KEY; else env.COSMIC_CREDENTIAL_ENCRYPTION_KEY = previousKey;
    await rm(directory, { recursive: true, force: true });
  }
});

test("personal Spotify refresh preserves the existing refresh token and stores only successful updates", async () => {
  const directory = await mkdtemp(join(tmpdir(), "cosmic-spotify-refresh-"));
  const previousCwd = process.cwd();
  const previousKey = env.COSMIC_CREDENTIAL_ENCRYPTION_KEY;
  const previousFetch = globalThis.fetch;
  env.COSMIC_CREDENTIAL_ENCRYPTION_KEY = key;
  env.SPOTIFY_CLIENT_ID = "client-test";
  env.SPOTIFY_CLIENT_SECRET = "secret-test";
  try {
    process.chdir(directory);
    const original = { access_token: "old-access", refresh_token: "old-refresh", expires_at: Date.now() - 1 };
    await storePersonalSpotifyToken(original);
    globalThis.fetch = async () => new Response(JSON.stringify({ access_token: "refreshed-access", expires_in: 3600 }), { status: 200 });
    const next = await refreshPersonalSpotifyToken(original);
    assert.equal(next.access_token, "refreshed-access");
    assert.equal(next.refresh_token, "old-refresh");
    assert.equal((await getPersonalSpotifyToken())?.refresh_token, "old-refresh");
    globalThis.fetch = async () => new Response("provider failure", { status: 503 });
    await assert.rejects(() => refreshPersonalSpotifyToken(next));
    assert.equal((await getPersonalSpotifyToken())?.access_token, "refreshed-access");
  } finally {
    globalThis.fetch = previousFetch;
    process.chdir(previousCwd);
    if (previousKey === undefined) delete env.COSMIC_CREDENTIAL_ENCRYPTION_KEY; else env.COSMIC_CREDENTIAL_ENCRYPTION_KEY = previousKey;
    delete env.SPOTIFY_CLIENT_ID;
    delete env.SPOTIFY_CLIENT_SECRET;
    await rm(directory, { recursive: true, force: true });
  }
});

test("personal Music reads and actions use the personal credential without account lookup", async () => {
  const directory = await mkdtemp(join(tmpdir(), "cosmic-spotify-music-"));
  const previousCwd = process.cwd();
  const previousKey = env.COSMIC_CREDENTIAL_ENCRYPTION_KEY;
  const previous = { id: env.SPOTIFY_CLIENT_ID, secret: env.SPOTIFY_CLIENT_SECRET, redirect: env.SPOTIFY_REDIRECT_URI };
  const previousFetch = globalThis.fetch;
  env.COSMIC_CREDENTIAL_ENCRYPTION_KEY = key;
  env.SPOTIFY_CLIENT_ID = "client-test";
  env.SPOTIFY_CLIENT_SECRET = "secret-test";
  env.SPOTIFY_REDIRECT_URI = "http://localhost:3000/api/auth/spotify/callback";
  const requests: string[] = [];
  globalThis.fetch = async (input) => { requests.push(String(input)); return new Response(null, { status: 204 }); };
  try {
    process.chdir(directory);
    await storePersonalSpotifyToken({ access_token: "personal-access", scope: "user-modify-playback-state" });
    assert.equal((await personalSnapshotWithDiagnostics()).snapshot.connected, true);
    await personalAction("pause");
    assert.equal(requests.some((url) => url.includes("/me/player")), true);
  } finally {
    globalThis.fetch = previousFetch;
    process.chdir(previousCwd);
    if (previousKey === undefined) delete env.COSMIC_CREDENTIAL_ENCRYPTION_KEY; else env.COSMIC_CREDENTIAL_ENCRYPTION_KEY = previousKey;
    if (previous.id === undefined) delete env.SPOTIFY_CLIENT_ID; else env.SPOTIFY_CLIENT_ID = previous.id;
    if (previous.secret === undefined) delete env.SPOTIFY_CLIENT_SECRET; else env.SPOTIFY_CLIENT_SECRET = previous.secret;
    if (previous.redirect === undefined) delete env.SPOTIFY_REDIRECT_URI; else env.SPOTIFY_REDIRECT_URI = previous.redirect;
    await rm(directory, { recursive: true, force: true });
  }
});
