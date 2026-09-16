import "server-only";

import { chmod, mkdir, open, readFile, rename } from "node:fs/promises";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { dirname, join } from "node:path";
import type { ProviderCredentialOwner, ProviderId } from "./access";
import { isProviderId } from "./access";
import type { ProviderCredentialPayload, ProviderCredentialStore } from "./credentialStore";

const VERSION = 1;
const ALGORITHM = "aes-256-gcm";
const KEY_ENV = "COSMIC_CREDENTIAL_ENCRYPTION_KEY";
const defaultFile = () => join(process.cwd(), ".cosmic", "personal-provider-credentials.json");
const ownerKey = (owner: ProviderCredentialOwner) => owner.kind === "personal" ? "personal" : "account:" + owner.accountId;

interface Envelope {
  version: 1;
  algorithm: typeof ALGORITHM;
  iv: string;
  ciphertext: string;
  tag: string;
}

type RecordSet = Record<string, Record<string, ProviderCredentialPayload>>;

function encryptionKey(key?: Buffer): Buffer {
  if (key) {
    if (key.length !== 32) throw new Error("Local credential encryption key must be 32 bytes.");
    return Buffer.from(key);
  }
  const raw = process.env[KEY_ENV];
  if (!raw) throw new Error(KEY_ENV + " is required for local provider credentials.");
  const decoded = Buffer.from(raw, "base64");
  if (decoded.length !== 32) throw new Error(KEY_ENV + " must decode to 32 bytes.");
  return decoded;
}

function encrypt(records: RecordSet, key: Buffer): Envelope {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(records), "utf8"), cipher.final()]);
  return {
    version: VERSION,
    algorithm: ALGORITHM,
    iv: iv.toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
    tag: cipher.getAuthTag().toString("base64url"),
  };
}

function decrypt(envelope: unknown, key: Buffer): RecordSet {
  if (!envelope || typeof envelope !== "object") throw new Error("Invalid local credential envelope.");
  const value = envelope as Partial<Envelope>;
  if (value.version !== VERSION || value.algorithm !== ALGORITHM || !value.iv || !value.ciphertext || !value.tag) throw new Error("Unsupported local credential envelope.");
  try {
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(value.iv, "base64url"));
    decipher.setAuthTag(Buffer.from(value.tag, "base64url"));
    const plaintext = Buffer.concat([decipher.update(Buffer.from(value.ciphertext, "base64url")), decipher.final()]).toString("utf8");
    const records = JSON.parse(plaintext) as unknown;
    if (!records || typeof records !== "object" || Array.isArray(records)) throw new Error("Invalid local credential records.");
    return records as RecordSet;
  } catch {
    throw new Error("Local provider credentials could not be authenticated.");
  }
}

function validateProvider(provider: ProviderId): ProviderId {
  if (!isProviderId(provider)) throw new Error("Unsupported provider.");
  return provider;
}

function validateOwner(owner: ProviderCredentialOwner): ProviderCredentialOwner {
  if (owner.kind === "personal" && owner.id === "personal") return owner;
  if (owner.kind === "legacy-account" && owner.accountId.trim() && !owner.accountId.includes("/") && !owner.accountId.includes("\\")) return owner;
  throw new Error("Invalid provider credential owner.");
}

async function readRecords(filePath: string, key: Buffer): Promise<RecordSet> {
  try {
    return decrypt(JSON.parse(await readFile(filePath, "utf8")) as unknown, key);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && (error as { code?: unknown }).code === "ENOENT") return {};
    throw error;
  }
}

async function atomicWrite(filePath: string, envelope: Envelope): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true, mode: 0o700 });
  await chmod(dirname(filePath), 0o700);
  const temporaryPath = filePath + ".tmp";
  const handle = await open(temporaryPath, "w", 0o600);
  try {
    await handle.writeFile(JSON.stringify(envelope), "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  await chmod(temporaryPath, 0o600);
  await rename(temporaryPath, filePath);
  await chmod(filePath, 0o600);
}

export interface LocalProviderCredentialStoreOptions {
  readonly filePath?: string;
  readonly key?: Buffer;
}

export function createLocalProviderCredentialStore(options: LocalProviderCredentialStoreOptions = {}): ProviderCredentialStore {
  const filePath = options.filePath ?? defaultFile();
  const key = encryptionKey(options.key);
  let queue = Promise.resolve();
  const run = <T>(operation: () => Promise<T>): Promise<T> => {
    const next = queue.then(operation, operation);
    queue = next.then(() => undefined, () => undefined);
    return next;
  };

  return {
    get: <T extends ProviderCredentialPayload = ProviderCredentialPayload>(owner: ProviderCredentialOwner, provider: ProviderId) => run(async () => {
      const records = await readRecords(filePath, key);
      const value = records[ownerKey(validateOwner(owner))]?.[validateProvider(provider)];
      return (value ?? null) as T | null;
    }),
    set: (owner, provider, credential) => run(async () => {
      const safeOwner = validateOwner(owner);
      const safeProvider = validateProvider(provider);
      const records = await readRecords(filePath, key);
      records[ownerKey(safeOwner)] = { ...(records[ownerKey(safeOwner)] ?? {}), [safeProvider]: credential };
      await atomicWrite(filePath, encrypt(records, key));
    }),
    delete: (owner, provider) => run(async () => {
      const safeOwner = validateOwner(owner);
      const safeProvider = validateProvider(provider);
      const records = await readRecords(filePath, key);
      const ownerRecords = records[ownerKey(safeOwner)];
      if (!ownerRecords || !(safeProvider in ownerRecords)) return false;
      delete ownerRecords[safeProvider];
      if (!Object.keys(ownerRecords).length) delete records[ownerKey(safeOwner)];
      await atomicWrite(filePath, encrypt(records, key));
      return true;
    }),
    has: (owner, provider) => run(async () => {
      const records = await readRecords(filePath, key);
      return Object.prototype.hasOwnProperty.call(records[ownerKey(validateOwner(owner))] ?? {}, validateProvider(provider));
    }),
  };
}
