import "server-only";

import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDatabase } from "@/services/database/client";
import { providerConnections, providerCredentials } from "@/services/database/schema";
import { decryptCredentialPayload, encryptCredentialPayload } from "./credentialCrypto";

export type ProviderName = "gmail" | "spotify" | "calendar" | "plaid";
export type ProviderConnection = typeof providerConnections.$inferSelect;
export type ProviderCredential = Record<string, unknown>;

export async function listProviderConnections(userId: string) {
  return getDatabase().select().from(providerConnections).where(eq(providerConnections.userId, userId));
}

export async function getProviderConnection(userId: string, connectionId: string) {
  const rows = await getDatabase().select().from(providerConnections).where(and(eq(providerConnections.userId, userId), eq(providerConnections.id, connectionId))).limit(1);
  return rows[0] ?? null;
}

export async function findProviderConnection(userId: string, provider: ProviderName, providerAccountId: string) {
  const rows = await getDatabase().select().from(providerConnections).where(and(eq(providerConnections.userId, userId), eq(providerConnections.provider, provider), eq(providerConnections.providerAccountId, providerAccountId))).limit(1);
  return rows[0] ?? null;
}

export async function upsertProviderConnection(userId: string, input: { provider: ProviderName; providerType?: string; providerAccountId?: string; displayName?: string; email?: string }) {
  const existing = input.providerAccountId ? await findProviderConnection(userId, input.provider, input.providerAccountId) : null;
  const id = existing?.id ?? randomUUID();
  const rows = await getDatabase().insert(providerConnections).values({ id, userId, ...input }).onConflictDoUpdate({ target: providerConnections.id, set: { ...input, updatedAt: new Date(), status: "connected", reconnectRequired: false } }).returning();
  return rows[0];
}

export async function setProviderCredentials(userId: string, connectionId: string, payload: ProviderCredential) {
  if (!(await getProviderConnection(userId, connectionId))) throw new Error("Provider connection not found.");
  const encryptedPayload = encryptCredentialPayload(payload);
  const rows = await getDatabase().insert(providerCredentials).values({ connectionId, encryptedPayload, keyVersion: "v1" }).onConflictDoUpdate({ target: providerCredentials.connectionId, set: { encryptedPayload, keyVersion: "v1", updatedAt: new Date() } }).returning();
  return rows[0];
}

export async function getProviderCredentials<T = ProviderCredential>(userId: string, connectionId: string) {
  if (!(await getProviderConnection(userId, connectionId))) return null;
  const rows = await getDatabase().select().from(providerCredentials).where(eq(providerCredentials.connectionId, connectionId)).limit(1);
  return rows[0] ? decryptCredentialPayload<T>(rows[0].encryptedPayload) : null;
}

export async function deleteProviderConnection(userId: string, connectionId: string) {
  const rows = await getDatabase().delete(providerConnections).where(and(eq(providerConnections.userId, userId), eq(providerConnections.id, connectionId))).returning({ id: providerConnections.id });
  return Boolean(rows[0]);
}

export async function deleteProviderConnectionCredentials(userId: string, connectionId: string) {
  if (!(await getProviderConnection(userId, connectionId))) return false;
  const rows = await getDatabase().delete(providerCredentials).where(eq(providerCredentials.connectionId, connectionId)).returning({ connectionId: providerCredentials.connectionId });
  return Boolean(rows[0]);
}

export async function markProviderReconnectRequired(userId: string, connectionId: string) {
  await getDatabase().update(providerConnections).set({ reconnectRequired: true, status: "reconnect-required", updatedAt: new Date() }).where(and(eq(providerConnections.userId, userId), eq(providerConnections.id, connectionId)));
}

export async function updateProviderConnection(userId: string, connectionId: string, input: { displayName?: string; status?: string; reconnectRequired?: boolean }) {
  const rows = await getDatabase().update(providerConnections).set({ ...input, updatedAt: new Date() }).where(and(eq(providerConnections.userId, userId), eq(providerConnections.id, connectionId))).returning();
  return rows[0] ?? null;
}

export async function markProviderRefresh(userId: string, connectionId: string) {
  const rows = await getDatabase().update(providerConnections).set({ lastSuccessfulRefreshAt: new Date(), status: "connected", reconnectRequired: false, updatedAt: new Date() }).where(and(eq(providerConnections.userId, userId), eq(providerConnections.id, connectionId))).returning();
  return rows[0] ?? null;
}
