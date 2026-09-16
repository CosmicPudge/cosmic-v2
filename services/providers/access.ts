import "server-only";

import type {
  AccountPrincipal,
  DevicePrincipal,
  PersonalPrincipal,
  PrivateRequestContext,
} from "@/services/auth/privateContext";

export type ProviderId = "google" | "microsoft" | "spotify";

export type ProviderCredentialOwner =
  | { readonly kind: "personal"; readonly id: "personal" }
  | { readonly kind: "legacy-account"; readonly accountId: string };

export interface ProviderAccessContext {
  readonly principal: PrivateRequestContext["principal"];
  readonly owner: ProviderCredentialOwner | null;
}

export function providerAccessContext(requestContext: PrivateRequestContext): ProviderAccessContext {
  return {
    principal: requestContext.principal,
    owner: providerCredentialOwner(requestContext.principal),
  };
}

export function providerCredentialOwner(
  principal: PersonalPrincipal | AccountPrincipal | DevicePrincipal,
): ProviderCredentialOwner | null {
  if (principal.kind === "personal") return { kind: "personal", id: "personal" };
  if (principal.kind === "account") return { kind: "legacy-account", accountId: principal.accountId };
  return null;
}

export function requireProviderCredentialOwner(context: ProviderAccessContext): ProviderCredentialOwner {
  if (!context.owner) throw new Error("Device principals cannot own provider credentials.");
  return context.owner;
}

export function isProviderId(value: unknown): value is ProviderId {
  return value === "google" || value === "microsoft" || value === "spotify";
}
