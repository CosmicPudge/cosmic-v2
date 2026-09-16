import type { CosmicPrincipal } from "@/services/auth/privateContext";

/**
 * Durable ownership is a separate namespace from account UUIDs. The literal
 * personal key is stable across restarts and is never generated from input.
 */
export interface PersonalOwner {
  readonly kind: "personal";
  readonly id: "personal";
}

export interface LegacyAccountOwner {
  readonly kind: "legacy-account";
  readonly accountId: string;
}

export type DurableOwner = PersonalOwner | LegacyAccountOwner;

export const PERSONAL_OWNER: PersonalOwner = Object.freeze({
  kind: "personal",
  id: "personal",
});

export function resolvePersonalOwner(principal: CosmicPrincipal): PersonalOwner | null {
  return principal.kind === "personal" ? PERSONAL_OWNER : null;
}

export function resolveDurableOwner(principal: CosmicPrincipal): DurableOwner | null {
  if (principal.kind === "personal") return PERSONAL_OWNER;
  if (principal.kind === "account") return { kind: "legacy-account", accountId: principal.accountId };
  return null;
}

/** Safe identity-only representation for logs, diagnostics, and future keys. */
export function serializeDurableOwner(owner: DurableOwner): Record<string, string> {
  return owner.kind === "personal"
    ? { kind: owner.kind, id: owner.id }
    : { kind: owner.kind, accountId: owner.accountId };
}
