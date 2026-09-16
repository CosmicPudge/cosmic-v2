import "server-only";

import type { DurableOwner } from "@/services/ownership/owner";
import { resolveDurableOwnerRecord, type DatabaseOwnerReference, type DurableOwnerRepositoryAdapter } from "@/services/ownership/repository";

export type SchoolDatabaseOwner = DatabaseOwnerReference;

export type SchoolOwnershipFields = {
  ownerId?: string | null;
  userId?: string | null;
  accountId?: string | null;
};

export async function resolveSchoolOwner(
  owner: DurableOwner,
  adapter?: DurableOwnerRepositoryAdapter,
): Promise<SchoolDatabaseOwner | null> {
  return resolveDurableOwnerRecord(owner, adapter);
}

export function validateSchoolOwnerConsistency(
  owner: SchoolDatabaseOwner,
  fields: SchoolOwnershipFields,
): boolean {
  if (fields.ownerId !== undefined && fields.ownerId !== null && fields.ownerId !== owner.databaseOwnerId) return false;
  const legacyIds = [fields.userId, fields.accountId].filter((value): value is string => value !== undefined && value !== null);
  if (legacyIds.some((value) => value !== owner.legacyAccountId)) return false;
  return true;
}

export function validateSchoolParentChildOwnership(
  parent: SchoolOwnershipFields,
  child: SchoolOwnershipFields,
): boolean {
  if (parent.ownerId && child.ownerId && parent.ownerId !== child.ownerId) return false;
  const parentLegacy = parent.userId ?? parent.accountId ?? null;
  const childLegacy = child.userId ?? child.accountId ?? null;
  if (parentLegacy && childLegacy && parentLegacy !== childLegacy) return false;
  return true;
}
