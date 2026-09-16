import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { GET as startGoogle } from "./route";
import { GET as googleCallback } from "./callback/route";
import { getPersonalGmailToken } from "@/services/mail/gmail";

const key = Buffer.alloc(32, 11).toString("base64");
const env = process.env as Record<string, string | undefined>;

function setCookieHeaders(response: Response) {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  return (headers.getSetCookie?.() ?? []).map((value) => value.split(";")[0]);
}

test("personal Google OAuth starts locally with owner-bound S256 PKCE", async () => {
  const previous = { node: process.env.NODE_ENV, id: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET, redirect: process.env.GOOGLE_REDIRECT_URI };
  env.NODE_ENV = "development";
  env.GOOGLE_CLIENT_ID = "client-test";
  env.GOOGLE_CLIENT_SECRET = "secret-test";
  env.GOOGLE_REDIRECT_URI = "http://localhost:3000/api/auth/google/callback";
  try {
    const response = await startGoogle(new Request("http://localhost:3000/api/auth/google?returnTo=%2Fgmail"));
    assert.equal(response.status, 302);
    const location = new URL(response.headers.get("location")!);
    assert.equal(location.searchParams.get("code_challenge_method"), "S256");
    assert.ok(location.searchParams.get("code_challenge"));
    assert.ok(setCookieHeaders(response).some((cookie) => cookie.startsWith("cosmic_oauth_state=")));
    assert.ok(setCookieHeaders(response).some((cookie) => cookie.startsWith("cosmic_oauth_pkce=")));
  } finally {
    if (previous.node === undefined) delete env.NODE_ENV; else env.NODE_ENV = previous.node;
    if (previous.id === undefined) delete env.GOOGLE_CLIENT_ID; else env.GOOGLE_CLIENT_ID = previous.id;
    if (previous.secret === undefined) delete env.GOOGLE_CLIENT_SECRET; else env.GOOGLE_CLIENT_SECRET = previous.secret;
    if (previous.redirect === undefined) delete env.GOOGLE_REDIRECT_URI; else env.GOOGLE_REDIRECT_URI = previous.redirect;
  }
});

test("personal Google callback stores only an encrypted personal credential", async () => {
  const directory = await mkdtemp(join(tmpdir(), "cosmic-google-callback-"));
  const previousCwd = process.cwd();
  const previous = { node: process.env.NODE_ENV, key: process.env.COSMIC_CREDENTIAL_ENCRYPTION_KEY, id: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET, redirect: process.env.GOOGLE_REDIRECT_URI };
  const previousFetch = globalThis.fetch;
  env.NODE_ENV = "development";
  env.COSMIC_CREDENTIAL_ENCRYPTION_KEY = key;
  env.GOOGLE_CLIENT_ID = "client-test";
  env.GOOGLE_CLIENT_SECRET = "secret-test";
  env.GOOGLE_REDIRECT_URI = "http://localhost:3000/api/auth/google/callback";
  try {
    process.chdir(directory);
    const start = await startGoogle(new Request("http://localhost:3000/api/auth/google?returnTo=%2Fgmail"));
    const cookies = setCookieHeaders(start);
    const location = new URL(start.headers.get("location")!);
    const state = location.searchParams.get("state")!;
    globalThis.fetch = async () => new Response(JSON.stringify({ access_token: "personal-access", refresh_token: "personal-refresh", expires_in: 3600, scope: "gmail.readonly gmail.send" }), { status: 200, headers: { "Content-Type": "application/json" } });
    const callback = await googleCallback(new Request("http://localhost:3000/api/auth/google/callback?state=" + encodeURIComponent(state) + "&code=synthetic-code", { headers: { cookie: cookies.join("; ") } }));
    assert.equal(callback.status, 302);
    assert.equal((await getPersonalGmailToken())?.access_token, "personal-access");
    const persisted = await readFile(join(directory, ".cosmic", "personal-provider-credentials.json"), "utf8");
    assert.equal(persisted.includes("personal-access"), false);
    assert.equal(persisted.includes("synthetic-code"), false);
  } finally {
    globalThis.fetch = previousFetch;
    process.chdir(previousCwd);
    if (previous.node === undefined) delete env.NODE_ENV; else env.NODE_ENV = previous.node;
    if (previous.key === undefined) delete env.COSMIC_CREDENTIAL_ENCRYPTION_KEY; else env.COSMIC_CREDENTIAL_ENCRYPTION_KEY = previous.key;
    if (previous.id === undefined) delete env.GOOGLE_CLIENT_ID; else env.GOOGLE_CLIENT_ID = previous.id;
    if (previous.secret === undefined) delete env.GOOGLE_CLIENT_SECRET; else env.GOOGLE_CLIENT_SECRET = previous.secret;
    if (previous.redirect === undefined) delete env.GOOGLE_REDIRECT_URI; else env.GOOGLE_REDIRECT_URI = previous.redirect;
    await rm(directory, { recursive: true, force: true });
  }
});
