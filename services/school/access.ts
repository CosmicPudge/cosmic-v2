import "server-only";

import type { CosmicAccount } from "@/core/contracts/Account";
import { getCurrentCosmicAccount } from "@/services/auth/server";

export type SchoolAudience = "disabled" | "owner-only" | "public";

export interface SchoolAccess {
  enabled: boolean;
  audience: SchoolAudience;
  reason?: "owner_not_configured" | "authentication_required" | "owner_only";
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
  const account = await getCurrentCosmicAccount(request);
  if (!account) throw new Response("Authentication required.", { status: 401 });
  if (!getSchoolAccess(account).enabled) throw new Response("School is not available.", { status: 403 });
  return account;
}
