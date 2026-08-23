import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { getDatabase } from "@/services/database/client";
import { syncDocuments, userPreferences } from "@/services/database/schema";
import type { CosmicSyncDomain } from "./contracts";

type CloudRow = { snapshot: unknown; revision: number; updatedAt: string };
const documentDomain = (domain: CosmicSyncDomain) => domain === "settings" ? null : domain;

export async function readCloudSnapshot(userId: string, domain: CosmicSyncDomain): Promise<CloudRow | null> {
  if (domain === "settings") { const [row] = await getDatabase().select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1); return row ? { snapshot: row.payload, revision: row.revision, updatedAt: row.updatedAt.toISOString() } : null; }
  const [row] = await getDatabase().select().from(syncDocuments).where(and(eq(syncDocuments.userId, userId), eq(syncDocuments.domain, domain))).limit(1); return row ? { snapshot: row.payload, revision: row.revision, updatedAt: row.updatedAt.toISOString() } : null;
}

export async function writeCloudSnapshot(userId: string, domain: CosmicSyncDomain, snapshot: unknown, expectedRevision: number) {
  const current = await readCloudSnapshot(userId, domain);
  if (!current && expectedRevision !== 0) return { conflict: true as const, snapshot: null, revision: 0, updatedAt: new Date(0).toISOString() };
  const database = getDatabase(); const updatedAt = new Date();
  if (domain === "settings") {
    const inserted = await database.insert(userPreferences).values({ userId, payload: snapshot, revision: 1, updatedAt }).onConflictDoUpdate({ target: userPreferences.userId, set: { payload: snapshot, revision: sql`${userPreferences.revision} + 1`, updatedAt }, where: eq(userPreferences.revision, expectedRevision) }).returning({ revision: userPreferences.revision });
    if (inserted[0]) return { revision: inserted[0].revision };
  } else {
    const inserted = await database.insert(syncDocuments).values({ userId, domain: documentDomain(domain)!, payload: snapshot, revision: 1, updatedAt }).onConflictDoUpdate({ target: [syncDocuments.userId, syncDocuments.domain], set: { payload: snapshot, revision: sql`${syncDocuments.revision} + 1`, updatedAt }, where: eq(syncDocuments.revision, expectedRevision) }).returning({ revision: syncDocuments.revision });
    if (inserted[0]) return { revision: inserted[0].revision };
  }
  const latest = await readCloudSnapshot(userId, domain); return { conflict: true as const, ...(latest ?? { snapshot: null, revision: 0, updatedAt: new Date(0).toISOString() }) };
}
