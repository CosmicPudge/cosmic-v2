import "server-only";

import type {
  AccountPrincipal,
  DevicePrincipal,
  PersonalPrincipal,
  PrivateRequestContext,
} from "@/services/auth/privateContext";
import { resolveDurableOwner, type DurableOwner } from "@/services/ownership/owner";

export type ProviderId = "google" | "microsoft" | "spotify" | "calendar";

export type ProviderCredentialOwner = DurableOwner;

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
  return resolveDurableOwner(principal);
}

export function requireProviderCredentialOwner(context: ProviderAccessContext): ProviderCredentialOwner {
  if (!context.owner) throw new Error("Device principals cannot own provider credentials.");
  return context.owner;
}

export function isProviderId(value: unknown): value is ProviderId {
  return value === "google" || value === "microsoft" || value === "spotify";
}
