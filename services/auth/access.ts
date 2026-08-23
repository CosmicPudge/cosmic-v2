import "server-only";

import { and, eq, gt, isNull, or } from "drizzle-orm";
import { accountModeration } from "@/services/database/schema";
import { getDatabase, isDatabaseConfigured } from "@/services/database/client";

export type AccountAccessState = { status: "active" | "suspended" | "banned"; expiresAt?: string; };

export async function getAccountAccessState(accountId: string): Promise<AccountAccessState> {
  if (!isDatabaseConfigured()) return { status: "active" };
  try {
    const rows = await getDatabase().select({ status: accountModeration.status, expiresAt: accountModeration.expiresAt }).from(accountModeration).where(and(eq(accountModeration.accountId, accountId), or(isNull(accountModeration.expiresAt), gt(accountModeration.expiresAt, new Date())))).limit(1);
    const record = rows[0];
    if (record?.status === "suspended" || record?.status === "banned") return { status: record.status, ...(record.expiresAt ? { expiresAt: record.expiresAt.toISOString() } : {}) };
  } catch { /* Keep authentication available if the moderation migration is not deployed yet. */ }
  return { status: "active" };
}

export function accountAccessMessage(state: AccountAccessState): string {
  return state.status === "suspended" ? `Account temporarily suspended${state.expiresAt ? ` until ${new Date(state.expiresAt).toISOString()}.` : "."}` : "Account access has been disabled.";
}
