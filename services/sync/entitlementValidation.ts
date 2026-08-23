import "server-only";

import { getAccountEntitlements } from "@/services/entitlements/service";

function premiumCollection(value: unknown, key: "recurringItems" | "budgets") {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const collection = (value as Record<string, unknown>)[key];
  return Array.isArray(collection) ? [...collection].sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))) : [];
}

export async function assertFinanceSnapshotWriteAllowed(userId: string, incoming: unknown, current: unknown) {
  const entitlements = await getAccountEntitlements(userId);
  if (entitlements.features["finance.recurring"] && entitlements.features["finance.budgets"]) return;
  for (const key of ["recurringItems", "budgets"] as const) {
    if (JSON.stringify(premiumCollection(incoming, key)) !== JSON.stringify(premiumCollection(current, key))) {
      throw new Response("Cosmic+ is required to create or change this Finance capability.", { status: 403 });
    }
  }
}
