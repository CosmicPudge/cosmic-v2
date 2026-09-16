import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { consumeOAuthPkceVerifier, consumeOAuthState, createOAuthPkceTransaction, createOAuthState, getOAuthReturnTo } from "./oauthState";

const accountId = "account-test";

function request(cookie: string) {
  return new Request("https://cosmic.test/api/auth/callback", { headers: { cookie } });
}

test("binds OAuth state to its provider and account", () => {
  const state = createOAuthState(accountId, "/account?connected=google", "google");
  const callback = request(state.cookie.split(";")[0]);

  assert.equal(consumeOAuthState(callback, state.state, accountId, "google"), true);
  assert.equal(consumeOAuthState(callback, state.state, accountId, "microsoft"), false);
  assert.equal(consumeOAuthState(callback, state.state, accountId, "spotify"), false);
  assert.equal(consumeOAuthState(callback, state.state, "other-account", "google"), false);
  assert.equal(getOAuthReturnTo(callback, state.state, accountId, "google"), "/account?connected=google");
});

test("rejects missing and unknown providers", () => {
  const missing = createOAuthState(accountId, "/account");
  const unknown = createOAuthState(accountId, "/account", "github");

  assert.equal(consumeOAuthState(request(missing.cookie.split(";")[0]), missing.state, accountId, "google"), false);
  assert.equal(consumeOAuthState(request(unknown.cookie.split(";")[0]), unknown.state, accountId, "google"), false);
});

test("rejects tampered and expired state", () => {
  const originalNow = Date.now;
  try {
    Date.now = () => 1_000_000;
    const state = createOAuthState(accountId, "/os", "google");
    const cookie = state.cookie.split(";")[0];
    const payload = cookie.slice(cookie.indexOf("=") + 1);
    const [encoded, signature] = payload.split(".");
    const tamperedEncoded = (encoded.startsWith("A") ? "B" : "A") + encoded.slice(1);
    const tampered = cookie.slice(0, cookie.indexOf("=") + 1) + tamperedEncoded + "." + signature;
    assert.equal(consumeOAuthState(request(tampered), state.state, accountId, "google"), false);

    Date.now = () => 1_000_000 + 10 * 60 * 1000 + 1;
    assert.equal(consumeOAuthState(request(cookie), state.state, accountId, "google"), false);
  } finally {
    Date.now = originalNow;
  }
});

test("uses secure, bounded, server-only state cookies", () => {
  const environment = process.env as Record<string, string | undefined>;
  const previous = environment.NODE_ENV;
  environment.NODE_ENV = "production";
  try {
    const state = createOAuthState(accountId, "https://evil.example/steal", "google");
    assert.match(state.cookie, /Path=\/api\/auth/);
    assert.match(state.cookie, /HttpOnly/);
    assert.match(state.cookie, /SameSite=Lax/);
    assert.match(state.cookie, /Max-Age=600/);
    assert.match(state.cookie, /Secure/);
    assert.doesNotMatch(state.cookie, /access_token|refresh_token|evil\.example/);
  } finally {
    if (previous === undefined) delete environment.NODE_ENV;
    else environment.NODE_ENV = previous;
  }
});

test("binds a personal Google transaction to owner kind and an HttpOnly S256 verifier", () => {
  const state = createOAuthState(undefined, "/gmail", "google", "personal");
  const pkce = createOAuthPkceTransaction(state.state);
  const callback = request(state.cookie.split(";")[0] + "; " + pkce.cookie.split(";")[0]);

  assert.equal(consumeOAuthState(callback, state.state, undefined, "google", "personal"), true);
  assert.equal(consumeOAuthState(callback, state.state, "legacy-account", "google", "legacy-account"), false);
  assert.equal(consumeOAuthState(callback, state.state, undefined, "microsoft", "personal"), false);
  assert.equal(consumeOAuthPkceVerifier(callback, state.state), pkce.verifier);
  assert.equal(createHash("sha256").update(pkce.verifier).digest("base64url"), pkce.challenge);
  assert.equal(state.cookie.includes(pkce.verifier), false);

  const withoutPkce = request(state.cookie.split(";")[0]);
  assert.equal(consumeOAuthPkceVerifier(withoutPkce, state.state), null);
  const pkceCookie = pkce.cookie.split(";")[0];
  const pkcePayload = pkceCookie.slice(pkceCookie.indexOf("=") + 1);
  const [encoded, signature] = pkcePayload.split(".");
  const tampered = pkceCookie.slice(0, pkceCookie.indexOf("=") + 1) + (encoded.startsWith("A") ? "B" : "A") + encoded.slice(1) + "." + signature;
  assert.equal(consumeOAuthPkceVerifier(request(state.cookie.split(";")[0] + "; " + tampered), state.state), null);
});
