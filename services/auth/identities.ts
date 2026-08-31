import "server-only";
import { getAuthRepository } from "./repository";
import type { AccountIdentityRecord } from "./contracts";

export type AccountIdentityProvider = AccountIdentityRecord["provider"];
export const SOCIAL_IDENTITY_PROVIDERS = ["google", "microsoft", "apple"] as const;
export async function listAccountIdentities(accountId: string) { const identities = await getAuthRepository().listAccountIdentities(accountId); if (identities.some((identity) => identity.provider === "password")) return identities; const account = await getAuthRepository().findUserById(accountId); if (!account?.passwordHash || !account.passwordSalt) return identities; const now = account.updatedAt; return [{ id: `password_${account.id}`, accountId, provider: "password" as const, providerSubject: account.id, email: account.email, createdAt: account.createdAt, lastUsedAt: now }, ...identities]; }
export async function findAccountIdentity(provider: AccountIdentityProvider, providerSubject: string) { return getAuthRepository().findAccountIdentity(provider, providerSubject); }
export async function linkAccountIdentity(accountId: string, input: { provider: Exclude<AccountIdentityProvider, "password">; providerSubject: string; email?: string }) { const existing = await findAccountIdentity(input.provider, input.providerSubject); if (existing && existing.accountId !== accountId) throw new Error("That identity is already linked to another Cosmic account."); if (existing) return existing; return getAuthRepository().createAccountIdentity({ accountId, ...input }); }
export async function touchAccountIdentity(id: string) { return getAuthRepository().touchAccountIdentity(id); }
export async function unlinkAccountIdentity(accountId: string, identityId: string) { return getAuthRepository().deleteAccountIdentity(accountId, identityId); }
