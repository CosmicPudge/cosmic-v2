import "server-only";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDatabase } from "@/services/database/client";
import { cosmicOwners, users } from "@/services/database/schema";
import type { DurableOwner } from "./owner";

export type DatabaseOwnerReference = {
  readonly databaseOwnerId: string;
  readonly kind: "personal" | "legacy-account";
  readonly externalKey: string;
  readonly legacyAccountId: string | null;
};

export interface DurableOwnerRepositoryAdapter {
  findPersonalOwner(): Promise<DatabaseOwnerReference | null>;
  findLegacyAccountOwner(accountId: string): Promise<DatabaseOwnerReference | null>;
  accountExists(accountId: string): Promise<boolean>;
  createLegacyAccountOwner(accountId: string): Promise<DatabaseOwnerReference | null>;
}

type RawDatabaseOwnerReference = {
  databaseOwnerId: string;
  kind: string;
  externalKey: string;
  legacyAccountId: string | null;
};

function asDatabaseOwnerReference(row: RawDatabaseOwnerReference): DatabaseOwnerReference {
  return { ...row, kind: row.kind as DatabaseOwnerReference["kind"] };
}

function isDatabaseOwnerReference(value: unknown): value is DatabaseOwnerReference {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.databaseOwnerId === "string"
    && row.databaseOwnerId.length > 0
    && (row.kind === "personal" || row.kind === "legacy-account")
    && typeof row.externalKey === "string"
    && (row.legacyAccountId === null || typeof row.legacyAccountId === "string");
}

function isPersonalOwnerReference(value: unknown): value is DatabaseOwnerReference {
  return isDatabaseOwnerReference(value)
    && value.kind === "personal"
    && value.externalKey === "personal"
    && value.legacyAccountId === null;
}

function isLegacyAccountOwnerReference(value: unknown, accountId: string): value is DatabaseOwnerReference {
  return isDatabaseOwnerReference(value)
    && value.kind === "legacy-account"
    && value.externalKey === accountId
    && value.legacyAccountId === accountId;
}

function createDatabaseOwnerRepository(): DurableOwnerRepositoryAdapter {
  const database = getDatabase();
  return {
    async findPersonalOwner() {
      const rows = await database.select({
        databaseOwnerId: cosmicOwners.id,
        kind: cosmicOwners.kind,
        externalKey: cosmicOwners.externalKey,
        legacyAccountId: cosmicOwners.legacyAccountId,
      }).from(cosmicOwners).where(eq(cosmicOwners.kind, "personal")).limit(1);
      return rows[0] ? asDatabaseOwnerReference(rows[0]) : null;
    },
    async findLegacyAccountOwner(accountId) {
      const rows = await database.select({
        databaseOwnerId: cosmicOwners.id,
        kind: cosmicOwners.kind,
        externalKey: cosmicOwners.externalKey,
        legacyAccountId: cosmicOwners.legacyAccountId,
      }).from(cosmicOwners).where(eq(cosmicOwners.legacyAccountId, accountId)).limit(1);
      return rows[0] ? asDatabaseOwnerReference(rows[0]) : null;
    },
    async accountExists(accountId) {
      const rows = await database.select({ id: users.id }).from(users).where(eq(users.id, accountId)).limit(1);
      return Boolean(rows[0]);
    },
    async createLegacyAccountOwner(accountId) {
      const rows = await database.insert(cosmicOwners).values({
        id: randomUUID(),
        kind: "legacy-account",
        externalKey: accountId,
        legacyAccountId: accountId,
      }).onConflictDoNothing({ target: [cosmicOwners.kind, cosmicOwners.externalKey] }).returning({
        databaseOwnerId: cosmicOwners.id,
        kind: cosmicOwners.kind,
        externalKey: cosmicOwners.externalKey,
        legacyAccountId: cosmicOwners.legacyAccountId,
      });
      return rows[0] ? asDatabaseOwnerReference(rows[0]) : null;
    },
  };
}

export async function resolveDurableOwnerRecord(
  owner: DurableOwner,
  adapter: DurableOwnerRepositoryAdapter = createDatabaseOwnerRepository(),
): Promise<DatabaseOwnerReference | null> {
  if (owner.kind === "personal") {
    const row = await adapter.findPersonalOwner();
    return isPersonalOwnerReference(row) ? row : null;
  }

  if (!owner.accountId) return null;
  if (!(await adapter.accountExists(owner.accountId))) return null;

  const existing = await adapter.findLegacyAccountOwner(owner.accountId);
  if (isLegacyAccountOwnerReference(existing, owner.accountId)) return existing;
  if (existing !== null) return null;

  const created = await adapter.createLegacyAccountOwner(owner.accountId);
  if (isLegacyAccountOwnerReference(created, owner.accountId)) return created;
  if (created !== null) return null;

  const raced = await adapter.findLegacyAccountOwner(owner.accountId);
  return isLegacyAccountOwnerReference(raced, owner.accountId) ? raced : null;
}
