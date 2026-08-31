import "server-only";

import { randomUUID } from "node:crypto";
import type { CosmicAccount } from "@/core/contracts/Account";
import { getAuthRepository } from "./repository";
import { linkAccountIdentity, findAccountIdentity, touchAccountIdentity, type AccountIdentityProvider } from "./identities";
import { normalizeEmail } from "./service";

export interface VerifiedSocialIdentity { provider: Exclude<AccountIdentityProvider, "password">; subject: string; email?: string; displayName?: string; }

function publicAccount(account: { id: string; email: string; displayName?: string; createdAt: string; updatedAt: string }): CosmicAccount { return { id: account.id, email: account.email, ...(account.displayName ? { displayName: account.displayName } : {}), createdAt: account.createdAt, updatedAt: account.updatedAt }; }

export async function signInOrCreateSocialAccount(identity: VerifiedSocialIdentity, linkToAccountId?: string) {
  const existing = await findAccountIdentity(identity.provider, identity.subject);
  if (existing) {
    if (linkToAccountId && existing.accountId !== linkToAccountId) throw new Error("That identity is already linked to another Cosmic account.");
    const account = await getAuthRepository().findUserById(existing.accountId);
    if (!account) throw new Error("The linked Cosmic account is unavailable.");
    await touchAccountIdentity(existing.id);
    return { account: publicAccount(account), identity: existing, created: false };
  }
  if (linkToAccountId) {
    const linked = await linkAccountIdentity(linkToAccountId, { provider: identity.provider, providerSubject: identity.subject, email: identity.email });
    const account = await getAuthRepository().findUserById(linkToAccountId);
    if (!account) throw new Error("The Cosmic account is unavailable.");
    return { account: publicAccount(account), identity: linked, created: false };
  }
  if (!identity.email) throw new Error("The provider did not return a verified email address.");
  const email = normalizeEmail(identity.email);
  if (await getAuthRepository().findUserByEmail(email)) throw new Error("An account already exists with this email. Sign into that account first, then link this identity.");
  const account = await getAuthRepository().createUser({ id: `user_${randomUUID()}`, email, displayName: identity.displayName });
  const linked = await linkAccountIdentity(account.id, { provider: identity.provider, providerSubject: identity.subject, email: identity.email });
  return { account: publicAccount(account), identity: linked, created: true };
}
