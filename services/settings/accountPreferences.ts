import "server-only";

import { eq } from "drizzle-orm";
import { getDatabase } from "@/services/database/client";
import { userPreferences } from "@/services/database/schema";
import { neutralPreferences } from "./preferences";

export async function getAccountPreferences(userId: string) {
  const rows = await getDatabase().select({ payload: userPreferences.payload }).from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  const payload = rows[0]?.payload;
  if (!payload || typeof payload !== "object") return neutralPreferences;
  const preferences = (payload as { preferences?: unknown }).preferences;
  if (!preferences || typeof preferences !== "object" || Array.isArray(preferences)) return neutralPreferences;
  return preferences as typeof neutralPreferences;
}
