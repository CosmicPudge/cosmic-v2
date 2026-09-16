import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { ProviderCredentialOwner } from "./access";
import { createLocalProviderCredentialStore } from "./localCredentialStore";

const key = Buffer.alloc(32, 7);
const personal: ProviderCredentialOwner = { kind: "personal", id: "personal" };
const account: ProviderCredentialOwner = { kind: "legacy-account", accountId: "account-1" };

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), "cosmic-provider-store-"));
  return { directory, filePath: join(directory, "credentials.json") };
}

test("encrypts credentials, isolates namespaces, and supports atomic concurrent writes", async () => {
  const { directory, filePath } = await fixture();
  try {
    const store = createLocalProviderCredentialStore({ filePath, key });
    await Promise.all([
      store.set(personal, "google", { access_token: "personal-secret" }),
      store.set(account, "google", { access_token: "account-secret" }),
      store.set(personal, "spotify", { refresh_token: "spotify-secret" }),
    ]);
    const raw = await readFile(filePath, "utf8");
    assert.equal(raw.includes("personal-secret"), false);
    assert.equal(raw.includes("account-secret"), false);
    assert.equal(raw.includes("spotify-secret"), false);
    assert.deepEqual(await store.get(personal, "google"), { access_token: "personal-secret" });
    assert.deepEqual(await store.get(account, "google"), { access_token: "account-secret" });
    assert.equal(await store.has(personal, "spotify"), true);
    assert.equal(await store.has(account, "spotify"), false);
    assert.equal((await stat(filePath)).mode & 0o777, 0o600);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("fails closed for missing keys, wrong keys, tampering, truncation, and unsupported envelopes", async () => {
  const { directory, filePath } = await fixture();
  try {
    assert.throws(() => createLocalProviderCredentialStore({ filePath }), /COSMIC_CREDENTIAL_ENCRYPTION_KEY/);
    const store = createLocalProviderCredentialStore({ filePath, key });
    await store.set(personal, "google", { access_token: "secret" });
    const wrongKey = createLocalProviderCredentialStore({ filePath, key: Buffer.alloc(32, 8) });
    await assert.rejects(() => wrongKey.get(personal, "google"), /could not be authenticated/);

    const original = JSON.parse(await readFile(filePath, "utf8")) as Record<string, unknown>;
    await writeFile(filePath, JSON.stringify({ ...original, ciphertext: String(original.ciphertext).slice(1) }));
    await assert.rejects(() => store.get(personal, "google"), /could not be authenticated/);
    await writeFile(filePath, JSON.stringify({ version: 99, algorithm: "aes-256-gcm", iv: "x", ciphertext: "x", tag: "x" }));
    await assert.rejects(() => store.get(personal, "google"), /Unsupported local credential envelope/);
    await writeFile(filePath, "{");
    await assert.rejects(() => store.get(personal, "google"));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("rejects unknown providers and path-shaped owners without plaintext fallback", async () => {
  const { directory, filePath } = await fixture();
  try {
    const store = createLocalProviderCredentialStore({ filePath, key });
    await assert.rejects(() => store.has(personal, "canvas" as "google"), /Unsupported provider/);
    await assert.rejects(() => store.has({ kind: "legacy-account", accountId: "../escape" }, "google"), /Invalid provider credential owner/);
    assert.equal(await store.get(personal, "google"), null);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("delete removes only the selected owner/provider credential", async () => {
  const { directory, filePath } = await fixture();
  try {
    const store = createLocalProviderCredentialStore({ filePath, key });
    await store.set(personal, "google", { value: "google" });
    await store.set(personal, "spotify", { value: "spotify" });
    assert.equal(await store.delete(personal, "google"), true);
    assert.equal(await store.has(personal, "google"), false);
    assert.equal(await store.has(personal, "spotify"), true);
    assert.equal(await store.delete(personal, "google"), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
