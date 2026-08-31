import type { CosmicAccount } from "@/core/contracts/Account";

type AccountLike = Pick<CosmicAccount, "id" | "email"> & { displayName?: string | null; createdAt: Date | string; updatedAt: Date | string };

/** Explicit client boundary: persistence/authentication fields are never copied. */
export function toPublicCosmicAccount(account: AccountLike): CosmicAccount {
  return { id: account.id, email: account.email, ...(account.displayName ? { displayName: account.displayName } : {}), createdAt: account.createdAt instanceof Date ? account.createdAt.toISOString() : account.createdAt, updatedAt: account.updatedAt instanceof Date ? account.updatedAt.toISOString() : account.updatedAt };
}
