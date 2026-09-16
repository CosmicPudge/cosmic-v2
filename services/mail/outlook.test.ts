import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createHash } from "node:crypto";
import { exchangeMicrosoftCode, getOutlookAuthorizationUrl, getPersonalOutlookToken, refreshPersonalOutlookToken, storePersonalOutlookToken } from "./outlook";

const key = Buffer.alloc(32, 17).toString("base64");
const env = process.env as Record<string, string | undefined>;

test("Microsoft personal authorization uses common authority, Mail.Read scopes, and S256 PKCE", () => {
  const previous = { id: env.MICROSOFT_CLIENT_ID, secret: env.MICROSOFT_CLIENT_SECRET, redirect: env.MICROSOFT_REDIRECT_URI };
  env.MICROSOFT_CLIENT_ID = "client-test";
  env.MICROSOFT_CLIENT_SECRET = "secret-test";
  env.MICROSOFT_REDIRECT_URI = "http://localhost:3000/api/auth/microsoft/callback";
  try {
    const url = new URL(getOutlookAuthorizationUrl("state-test", "challenge-test"));
    assert.equal(url.hostname, "login.microsoftonline.com");
    assert.equal(url.pathname, "/common/oauth2/v2.0/authorize");
    assert.equal(url.searchParams.get("code_challenge_method"), "S256");
    assert.equal(url.searchParams.get("code_challenge"), "challenge-test");
    assert.match(url.searchParams.get("scope") ?? "", /Mail\.Read/);
    assert.doesNotMatch(url.searchParams.get("scope") ?? "", /Calendars\./);
  } finally {
    if (previous.id === undefined) delete env.MICROSOFT_CLIENT_ID; else env.MICROSOFT_CLIENT_ID = previous.id;
    if (previous.secret === undefined) delete env.MICROSOFT_CLIENT_SECRET; else env.MICROSOFT_CLIENT_SECRET = previous.secret;
    if (previous.redirect === undefined) delete env.MICROSOFT_REDIRECT_URI; else env.MICROSOFT_REDIRECT_URI = previous.redirect;
  }
});

test("Microsoft code exchange sends the server-held verifier", async () => {
  const previousFetch = globalThis.fetch;
  const previous = { id: env.MICROSOFT_CLIENT_ID, secret: env.MICROSOFT_CLIENT_SECRET, redirect: env.MICROSOFT_REDIRECT_URI };
  env.MICROSOFT_CLIENT_ID = "client-test";
  env.MICROSOFT_CLIENT_SECRET = "secret-test";
  env.MICROSOFT_REDIRECT_URI = "http://localhost:3000/api/auth/microsoft/callback";
  let body = "";
  globalThis.fetch = async (_input, init) => { body = String(init?.body ?? ""); return new Response(JSON.stringify({ access_token: "synthetic-access", refresh_token: "synthetic-refresh", expires_in: 3600 }), { status: 200 }); };
  try {
    const verifier = "synthetic-verifier";
    const token = await exchangeMicrosoftCode("synthetic-code", verifier);
    assert.equal(token.access_token, "synthetic-access");
    assert.equal(new URLSearchParams(body).get("code_verifier"), verifier);
  } finally {
    globalThis.fetch = previousFetch;
    if (previous.id === undefined) delete env.MICROSOFT_CLIENT_ID; else env.MICROSOFT_CLIENT_ID = previous.id;
    if (previous.secret === undefined) delete env.MICROSOFT_CLIENT_SECRET; else env.MICROSOFT_CLIENT_SECRET = previous.secret;
    if (previous.redirect === undefined) delete env.MICROSOFT_REDIRECT_URI; else env.MICROSOFT_REDIRECT_URI = previous.redirect;
  }
});

test("personal Microsoft credentials use only the encrypted personal namespace", async () => {
  const directory = await mkdtemp(join(tmpdir(), "cosmic-outlook-store-"));
  const previousCwd = process.cwd();
  const previousKey = env.COSMIC_CREDENTIAL_ENCRYPTION_KEY;
  env.COSMIC_CREDENTIAL_ENCRYPTION_KEY = key;
  try {
    process.chdir(directory);
    await storePersonalOutlookToken({ access_token: "personal-access", refresh_token: "personal-refresh", scope: "Mail.Read" });
    assert.equal((await getPersonalOutlookToken())?.access_token, "personal-access");
    const persisted = await readFile(join(directory, ".cosmic", "personal-provider-credentials.json"), "utf8");
    assert.equal(persisted.includes("personal-access"), false);
    assert.equal(persisted.includes("personal-refresh"), false);
  } finally {
    process.chdir(previousCwd);
    if (previousKey === undefined) delete env.COSMIC_CREDENTIAL_ENCRYPTION_KEY; else env.COSMIC_CREDENTIAL_ENCRYPTION_KEY = previousKey;
    await rm(directory, { recursive: true, force: true });
  }
});

test("personal Microsoft refresh preserves the prior refresh token and stores the update", async () => {
  const directory = await mkdtemp(join(tmpdir(), "cosmic-outlook-refresh-"));
  const previousCwd = process.cwd();
  const previousKey = env.COSMIC_CREDENTIAL_ENCRYPTION_KEY;
  const previousFetch = globalThis.fetch;
  env.COSMIC_CREDENTIAL_ENCRYPTION_KEY = key;
  env.MICROSOFT_CLIENT_ID = "client-test";
  env.MICROSOFT_CLIENT_SECRET = "secret-test";
  globalThis.fetch = async () => new Response(JSON.stringify({ access_token: "refreshed-access", expires_in: 3600 }), { status: 200 });
  try {
    process.chdir(directory);
    const original = { access_token: "old-access", refresh_token: "old-refresh", expires_at: Date.now() - 1 };
    const next = await refreshPersonalOutlookToken(original);
    assert.equal(next.access_token, "refreshed-access");
    assert.equal(next.refresh_token, "old-refresh");
    assert.equal((await getPersonalOutlookToken())?.refresh_token, "old-refresh");
    assert.equal(createHash("sha256").update("old-refresh").digest("hex").length, 64);
  } finally {
    globalThis.fetch = previousFetch;
    process.chdir(previousCwd);
    if (previousKey === undefined) delete env.COSMIC_CREDENTIAL_ENCRYPTION_KEY; else env.COSMIC_CREDENTIAL_ENCRYPTION_KEY = previousKey;
    delete env.MICROSOFT_CLIENT_ID;
    delete env.MICROSOFT_CLIENT_SECRET;
    await rm(directory, { recursive: true, force: true });
  }
});
