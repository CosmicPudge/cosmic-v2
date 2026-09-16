import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  exchangeGoogleCode,
  getGoogleAuthorizationUrl,
  getPersonalGmailToken,
  GmailProvider,
  storePersonalGmailToken,
} from "./gmail";

const key = Buffer.alloc(32, 9).toString("base64");

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

test("Google authorization requests use Gmail-only scopes and S256 PKCE", () => {
  const previous = { id: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET, redirect: process.env.GOOGLE_REDIRECT_URI };
  process.env.GOOGLE_CLIENT_ID = "client-test";
  process.env.GOOGLE_CLIENT_SECRET = "secret-test";
  process.env.GOOGLE_REDIRECT_URI = "http://localhost/callback";
  try {
    const url = new URL(getGoogleAuthorizationUrl("state-test", "challenge-test"));
    assert.equal(url.searchParams.get("code_challenge"), "challenge-test");
    assert.equal(url.searchParams.get("code_challenge_method"), "S256");
    assert.deepEqual(url.searchParams.get("scope")?.split(" ").sort(), ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.send"].sort());
    assert.equal(url.searchParams.has("calendar"), false);
  } finally {
    const env = process.env as Record<string, string | undefined>;
    if (previous.id === undefined) delete env.GOOGLE_CLIENT_ID; else env.GOOGLE_CLIENT_ID = previous.id;
    if (previous.secret === undefined) delete env.GOOGLE_CLIENT_SECRET; else env.GOOGLE_CLIENT_SECRET = previous.secret;
    if (previous.redirect === undefined) delete env.GOOGLE_REDIRECT_URI; else env.GOOGLE_REDIRECT_URI = previous.redirect;
  }
});

test("Google code exchange sends the server-held PKCE verifier", async () => {
  const previous = globalThis.fetch;
  let body = "";
  globalThis.fetch = async (_input, init) => {
    body = String(init?.body ?? "");
    return response({ access_token: "access", refresh_token: "refresh", expires_in: 3600, scope: "gmail.readonly" });
  };
  const previousEnv = { id: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET, redirect: process.env.GOOGLE_REDIRECT_URI };
  process.env.GOOGLE_CLIENT_ID = "client-test";
  process.env.GOOGLE_CLIENT_SECRET = "secret-test";
  process.env.GOOGLE_REDIRECT_URI = "http://localhost/callback";
  try {
    const token = await exchangeGoogleCode("code-test", "verifier-test");
    assert.equal(token.access_token, "access");
    assert.match(body, /code_verifier=verifier-test/);
  } finally {
    globalThis.fetch = previous;
    const env = process.env as Record<string, string | undefined>;
    if (previousEnv.id === undefined) delete env.GOOGLE_CLIENT_ID; else env.GOOGLE_CLIENT_ID = previousEnv.id;
    if (previousEnv.secret === undefined) delete env.GOOGLE_CLIENT_SECRET; else env.GOOGLE_CLIENT_SECRET = previousEnv.secret;
    if (previousEnv.redirect === undefined) delete env.GOOGLE_REDIRECT_URI; else env.GOOGLE_REDIRECT_URI = previousEnv.redirect;
  }
});

test("personal Gmail uses the encrypted personal store and never the legacy plaintext fallback", async () => {
  const directory = await mkdtemp(join(tmpdir(), "cosmic-gmail-personal-"));
  const previousCwd = process.cwd();
  const previousKey = process.env.COSMIC_CREDENTIAL_ENCRYPTION_KEY;
  try {
    process.chdir(directory);
    process.env.COSMIC_CREDENTIAL_ENCRYPTION_KEY = key;
    await mkdir(join(directory, ".cosmic"), { recursive: true });
    await writeFile(join(directory, ".cosmic", "gmail-token.json"), JSON.stringify({ access_token: "legacy-token" }));
    assert.equal(await getPersonalGmailToken(), null);
    await storePersonalGmailToken({ access_token: "personal-token", refresh_token: "personal-refresh", scope: "gmail.readonly" });
    assert.deepEqual(await getPersonalGmailToken(), { access_token: "personal-token", refresh_token: "personal-refresh", scope: "gmail.readonly" });
    const encrypted = await readFile(join(directory, ".cosmic", "personal-provider-credentials.json"), "utf8");
    assert.equal(encrypted.includes("personal-token"), false);
    assert.equal(encrypted.includes("legacy-token"), false);
  } finally {
    process.chdir(previousCwd);
    if (previousKey === undefined) delete (process.env as Record<string, string | undefined>).COSMIC_CREDENTIAL_ENCRYPTION_KEY; else process.env.COSMIC_CREDENTIAL_ENCRYPTION_KEY = previousKey;
    await rm(directory, { recursive: true, force: true });
  }
});

test("personal Gmail refresh preserves an existing refresh token and writes back to the personal store", async () => {
  const directory = await mkdtemp(join(tmpdir(), "cosmic-gmail-refresh-"));
  const previousCwd = process.cwd();
  const previousKey = process.env.COSMIC_CREDENTIAL_ENCRYPTION_KEY;
  const previousFetch = globalThis.fetch;
  let call = 0;
  try {
    process.chdir(directory);
    process.env.COSMIC_CREDENTIAL_ENCRYPTION_KEY = key;
    await storePersonalGmailToken({ access_token: "old-access", refresh_token: "old-refresh", expires_at: 1, scope: "gmail.readonly" });
    globalThis.fetch = async () => {
      call += 1;
      return call === 1 ? response({ access_token: "new-access", expires_in: 3600 }) : response({ messages: [] });
    };
    const provider = new GmailProvider({ access_token: "old-access", refresh_token: "old-refresh", expires_at: 1, scope: "gmail.readonly" }, "", async (next) => { await storePersonalGmailToken(next); });
    await provider.getMessages();
    const stored = await getPersonalGmailToken();
    assert.equal(stored?.access_token, "new-access");
    assert.equal(stored?.refresh_token, "old-refresh");
    assert.equal(stored?.scope, "gmail.readonly");
    assert.equal(typeof stored?.expires_at, "number");
  } finally {
    globalThis.fetch = previousFetch;
    process.chdir(previousCwd);
    if (previousKey === undefined) delete (process.env as Record<string, string | undefined>).COSMIC_CREDENTIAL_ENCRYPTION_KEY; else process.env.COSMIC_CREDENTIAL_ENCRYPTION_KEY = previousKey;
    await rm(directory, { recursive: true, force: true });
  }
});
