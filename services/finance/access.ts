import type { PrivateRequestContext } from "@/services/auth/privateContext";
import { resolvePrivateRequestContext } from "@/services/auth/privateContext";

export type FinanceStorageOwner =
  | { kind: "legacy-account"; accountId: string }
  | { kind: "unavailable"; reason: "personal-storage-owner-not-mapped" };

export interface FinanceAccessContext {
  readonly principal: PrivateRequestContext["principal"];
  readonly request: PrivateRequestContext;
  readonly storageOwner: FinanceStorageOwner;
}

export const PERSONAL_FINANCE_UNAVAILABLE_ERROR = "storage-unavailable-in-personal-mode";

export function personalFinanceAccessContext(request: Request): FinanceAccessContext | null {
  const context = resolvePrivateRequestContext(request, "private-personal");
  if (!context) return null;
  return {
    principal: context.principal,
    request: context,
    storageOwner: { kind: "unavailable", reason: "personal-storage-owner-not-mapped" },
  };
}

/**
 * Resolve Finance authorization separately from durable Finance ownership.
 * Personal requests are allowed to establish intent, but never receive a
 * fabricated or guessed database/Plaid owner.
 */
export async function requireFinanceAccessContext(request: Request): Promise<FinanceAccessContext> {
  const personal = personalFinanceAccessContext(request);
  if (personal) return personal;

  const { requireCosmicAccount } = await import("@/services/auth/server");
  const account = await requireCosmicAccount(request);
  const accountRequest: PrivateRequestContext = {
    principal: { kind: "account", accountId: account.id },
    policy: "private-account",
    mode: "account",
    origin: "public-host",
  };
  return {
    principal: accountRequest.principal,
    request: accountRequest,
    storageOwner: { kind: "legacy-account", accountId: account.id },
  };
}

export async function requireFinanceStorageOwner(request: Request): Promise<Extract<FinanceStorageOwner, { kind: "legacy-account" }>> {
  const access = await requireFinanceAccessContext(request);
  if (access.storageOwner.kind === "unavailable") {
    throw Response.json(
      { error: PERSONAL_FINANCE_UNAVAILABLE_ERROR },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  return access.storageOwner;
}
