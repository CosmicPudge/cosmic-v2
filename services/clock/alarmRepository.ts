import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { getDatabase } from "@/services/database/client";
import { clockAlarms } from "@/services/database/schema";

export type AccountAlarmInput = {
  id: string;
  label: string;
  time: string;
  enabled: boolean;
  repeatWeekdays: number[];
  snoozeEnabled: boolean;
};

function serialize(row: typeof clockAlarms.$inferSelect) {
  return {
    id: row.id,
    label: row.label,
    time: row.time,
    enabled: row.enabled,
    repeatWeekdays: row.repeatWeekdays,
    snoozeEnabled: row.snoozeEnabled,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listAccountAlarms(userId: string) {
  const rows = await getDatabase().select().from(clockAlarms).where(eq(clockAlarms.userId, userId)).orderBy(asc(clockAlarms.time), asc(clockAlarms.createdAt));
  return rows.map(serialize);
}

export async function createAccountAlarm(userId: string, input: AccountAlarmInput) {
  const [row] = await getDatabase().insert(clockAlarms).values({ userId, ...input }).returning();
  return row ? serialize(row) : null;
}

export async function updateAccountAlarm(userId: string, id: string, input: Omit<AccountAlarmInput, "id">) {
  const [row] = await getDatabase().update(clockAlarms).set({ ...input, updatedAt: new Date() }).where(and(eq(clockAlarms.userId, userId), eq(clockAlarms.id, id))).returning();
  return row ? serialize(row) : null;
}

export async function deleteAccountAlarm(userId: string, id: string) {
  const deleted = await getDatabase().delete(clockAlarms).where(and(eq(clockAlarms.userId, userId), eq(clockAlarms.id, id))).returning({ id: clockAlarms.id });
  return deleted.length > 0;
}
