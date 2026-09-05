/**
 * Raw uploads are deliberately not exposed as public URLs. Stores are private
 * and every operation requires an account-scoped key.
 */
export interface SchoolAssetStore {
  put(input: { accountId: string; sourceId: string; bytes: Uint8Array; mimeType: string; safeFileName: string }): Promise<{ provider: string; key: string }>;
  get(input: { accountId: string; key: string }): Promise<Uint8Array | null>;
  delete(input: { accountId: string; key: string }): Promise<void>;
}

import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { del, get, put } from "@vercel/blob";

/** Local development store only. Never claim this is durable production storage. */
export class LocalSchoolAssetStore implements SchoolAssetStore {
  private root = path.join(process.cwd(), ".school-assets");
  async put(input: { accountId: string; sourceId: string; bytes: Uint8Array; mimeType: string; safeFileName: string }) { const extension = path.extname(input.safeFileName).toLowerCase().replace(/[^a-z0-9.]/g, ""); const key = `${input.accountId}/${input.sourceId}/${crypto.randomUUID()}${extension}`; const target = path.join(this.root, key); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, input.bytes); return { provider: "local-development", key }; }
  async get(input: { accountId: string; key: string }) { if (!input.key.startsWith(`${input.accountId}/`) || input.key.includes("..")) return null; try { return new Uint8Array(await readFile(path.join(this.root, input.key))); } catch { return null; } }
  async delete(input: { accountId: string; key: string }) { if (!input.key.startsWith(`${input.accountId}/`) || input.key.includes("..")) return; try { await unlink(path.join(this.root, input.key)); } catch { /* already absent */ } }
}

export class UnconfiguredSchoolAssetStore implements SchoolAssetStore {
  async put(): Promise<{ provider: string; key: string }> { throw new Error("Production object storage is not configured."); }
  async get(): Promise<Uint8Array | null> { return null; }
  async delete(): Promise<void> { return undefined; }
}

export class VercelBlobSchoolAssetStore implements SchoolAssetStore {
  async put(input: { accountId: string; sourceId: string; bytes: Uint8Array; mimeType: string; safeFileName: string }) {
    const extension = input.safeFileName.toLowerCase().match(/\.(pdf|docx|txt|md|png|jpe?g|webp|mp3|m4a|wav|webm|aac|ogg)$/)?.[1] ?? "bin";
    const pathname = `school/${input.accountId}/${input.sourceId}/${crypto.randomUUID()}.${extension}`;
    const blob = await put(pathname, Buffer.from(input.bytes), { access: "private", contentType: input.mimeType, addRandomSuffix: false });
    return { provider: "vercel-blob", key: blob.pathname };
  }
  async get(input: { accountId: string; key: string }) {
    if (!input.key.startsWith(`school/${input.accountId}/`) || input.key.includes("..")) return null;
    const result = await get(input.key, { access: "private", useCache: false });
    return result?.stream ? new Uint8Array(await new Response(result.stream).arrayBuffer()) : null;
  }
  async delete(input: { accountId: string; key: string }) {
    if (!input.key.startsWith(`school/${input.accountId}/`) || input.key.includes("..")) return;
    await del(input.key);
  }
}

export function getSchoolAssetStore(): SchoolAssetStore {
  if (process.env.NODE_ENV !== "production") return new LocalSchoolAssetStore();
  return process.env.BLOB_READ_WRITE_TOKEN ? new VercelBlobSchoolAssetStore() : new UnconfiguredSchoolAssetStore();
}

export async function storePrivateSourceFile(): Promise<{ storageReference: null }> {
  return { storageReference: null };
}
