import type { CosmicAccount } from "@/core/contracts/Account";
import {
  resolvePrivateRequestContext,
  type CosmicPrincipal,
  type PrivateRequestContext,
} from "@/services/auth/privateContext";

export type SchoolAudience = "disabled" | "owner-only" | "public";

export interface SchoolAccess {
  enabled: boolean;
  audience: SchoolAudience;
  reason?: "owner_not_configured" | "authentication_required" | "owner_only";
}

export type SchoolStorageOwner =
  | { kind: "legacy-account"; accountId: string }
  | { kind: "unavailable"; reason: "personal-storage-owner-not-mapped" };

export interface SchoolAccessContext {
  principal: CosmicPrincipal;
  request: PrivateRequestContext;
  storageOwner: SchoolStorageOwner;
}

export function personalSchoolAccessContext(request: Request): SchoolAccessContext | null {
  const privateContext = resolvePrivateRequestContext(request, "private-personal");
  if (!privateContext) return null;
  return {
    principal: privateContext.principal,
    request: privateContext,
    storageOwner: { kind: "unavailable", reason: "personal-storage-owner-not-mapped" },
  };
}

/** Temporary owner-only capability. Keep the owner ID server-side until School is public. */
export function getSchoolAccess(account: Pick<CosmicAccount, "id"> | null): SchoolAccess {
  const ownerId = process.env.COSMIC_OWNER_USER_ID?.trim();
  if (!ownerId) return { enabled: false, audience: "disabled", reason: "owner_not_configured" };
  if (!account) return { enabled: false, audience: "disabled", reason: "authentication_required" };
  const testIds = (process.env.COSMIC_SCHOOL_TEST_USER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  return account.id === ownerId || testIds.includes(account.id)
    ? { enabled: true, audience: "owner-only" }
    : { enabled: false, audience: "owner-only", reason: "owner_only" };
}

export async function requireSchoolAccess(request: Request) {
  const { getCurrentCosmicAccount } = await import("@/services/auth/server");
  const account = await getCurrentCosmicAccount(request);
  if (!account) throw new Response("Authentication required.", { status: 401 });
  if (!getSchoolAccess(account).enabled) throw new Response("School is not available.", { status: 403 });
  return account;
}

/**
 * Resolve School authorization separately from its current legacy DB owner.
 * Personal requests are authorized without account lookup, but cannot read
 * existing account-owned rows until a reviewed ownership mapping exists.
 */
export async function requireSchoolAccessContext(request: Request): Promise<SchoolAccessContext> {
  const personal = personalSchoolAccessContext(request);
  if (personal) return personal;

  const account = await requireSchoolAccess(request);
  const privateRequest: PrivateRequestContext = {
    principal: { kind: "account", accountId: account.id },
    policy: "private-account",
    mode: "account",
    origin: "public-host",
  };
  return {
    principal: privateRequest.principal,
    request: privateRequest,
    storageOwner: { kind: "legacy-account", accountId: account.id },
  };
}
