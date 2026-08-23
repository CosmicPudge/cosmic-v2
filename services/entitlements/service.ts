import "server-only";

import { eq } from "drizzle-orm";
import type { CosmicEntitlements, CosmicFeature, CosmicPlan } from "@/core/contracts/Entitlements";
import { entitlementsForPlan, freeEntitlements } from "@/core/contracts/Entitlements";
import { getCurrentCosmicAccount, requireCosmicAccount } from "@/services/auth/server";
import { getDatabase, isDatabaseConfigured } from "@/services/database/client";
import { accountEntitlements } from "@/services/database/schema";
import { getBillingSubscription } from "@/services/billing/repository";
import { isSubscriptionEntitled } from "@/services/billing/contracts";
import { isCheckoutConfigured } from "@/services/billing/stripe";

const developmentOverrides = new Map<string, CosmicPlan>();

function validPlan(value: unknown): value is CosmicPlan {
  return value === "free" || value === "cosmic_plus";
}

export async function getAccountEntitlements(accountId: string): Promise<CosmicEntitlements> {
  const override = getDevelopmentEntitlement(accountId);
  if (override && process.env.NODE_ENV !== "production") return entitlementsForPlan(override, "development-override");
  return entitlementsForPlan(await getAccountBillingPlan(accountId), "account");
}

export function getDevelopmentEntitlement(accountId: string): CosmicPlan | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  return developmentOverrides.get(accountId);
}

export async function getAccountBillingPlan(accountId: string): Promise<CosmicPlan> {
  if (isCheckoutConfigured()) {
    try {
      const billing = await getBillingSubscription(accountId);
      return isSubscriptionEntitled(billing) ? "cosmic_plus" : "free";
    } catch {
      return "free";
    }
  }
  if (!isDatabaseConfigured()) return "free";
  try {
    const rows = await getDatabase().select({ plan: accountEntitlements.plan, source: accountEntitlements.source }).from(accountEntitlements).where(eq(accountEntitlements.userId, accountId)).limit(1);
    const plan = validPlan(rows[0]?.plan) ? rows[0].plan : "free";
    return plan;
  } catch {
    return "free";
  }
}

export async function resolveEntitlements(request: Request): Promise<CosmicEntitlements> {
  const account = await getCurrentCosmicAccount(request);
  return account ? getAccountEntitlements(account.id) : freeEntitlements;
}

export async function requireEntitlement(request: Request, feature: CosmicFeature): Promise<CosmicEntitlements> {
  const account = await requireCosmicAccount(request);
  const entitlements = await getAccountEntitlements(account.id);
  if (!entitlements.features[feature]) throw new Response("Cosmic+ is required for this feature.", { status: 403 });
  return entitlements;
}

export function setDevelopmentEntitlement(accountId: string, plan: CosmicPlan) {
  if (process.env.NODE_ENV === "production") throw new Error("Development entitlement overrides are disabled in production.");
  developmentOverrides.set(accountId, plan);
  return entitlementsForPlan(plan, "development-override");
}

export function clearDevelopmentEntitlement(accountId: string) {
  if (process.env.NODE_ENV === "production") throw new Error("Development entitlement overrides are disabled in production.");
  developmentOverrides.delete(accountId);
}
