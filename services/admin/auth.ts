import "server-only";

import { and, eq } from "drizzle-orm";
import { accountRoles } from "@/services/database/schema";
import { getDatabase, isDatabaseConfigured } from "@/services/database/client";
import { requireCosmicAccount } from "@/services/auth/server";

export async function isAdminAccount(accountId: string) {
  if (!isDatabaseConfigured()) return false;
  const rows = await getDatabase().select({ accountId: accountRoles.accountId }).from(accountRoles).where(and(eq(accountRoles.accountId, accountId), eq(accountRoles.role, "admin"))).limit(1);
  return Boolean(rows[0]);
}

export async function requireAdmin(request: Request) {
  const account = await requireCosmicAccount(request);
  if (!(await isAdminAccount(account.id))) throw new Response("Administrator access required.", { status: 403 });
  return account;
}
