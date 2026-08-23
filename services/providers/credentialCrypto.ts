import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const VERSION = "v1";
const key = () => {
  const raw = process.env.COSMIC_CREDENTIAL_ENCRYPTION_KEY;
  if (!raw) throw new Error("COSMIC_CREDENTIAL_ENCRYPTION_KEY is required to store provider credentials.");
  const value = Buffer.from(raw, "base64");
  if (value.length !== 32) throw new Error("COSMIC_CREDENTIAL_ENCRYPTION_KEY must decode to 32 bytes.");
  return value;
};

export const isCredentialEncryptionConfigured = () => {
  try { key(); return true; } catch { return false; }
};

export function encryptCredentialPayload(payload: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return [VERSION, iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(":");
}

export function decryptCredentialPayload<T>(value: string): T {
  const [version, ivValue, tagValue, encryptedValue] = value.split(":");
  if (version !== VERSION || !ivValue || !tagValue || !encryptedValue) throw new Error("Unsupported credential format.");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64url")), decipher.final()]).toString("utf8")) as T;
}
