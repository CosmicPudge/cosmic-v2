import "server-only";

import { eq } from "drizzle-orm";
import { getDatabase } from "@/services/database/client";
import { userPreferences } from "@/services/database/schema";
import { neutralPreferences } from "./preferences";

const CACHE_MS = 30_000;
const cache = new Map<string, { expiresAt: number; preferences: typeof neutralPreferences }>();

export async function getAccountPreferences(userId: string) {
  const cached = cache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.preferences;
  const rows = await getDatabase().select({ payload: userPreferences.payload }).from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  const payload = rows[0]?.payload;
  if (!payload || typeof payload !== "object") { cache.set(userId, { expiresAt: Date.now() + CACHE_MS, preferences: neutralPreferences }); return neutralPreferences; }
  const preferences = (payload as { preferences?: unknown }).preferences;
  if (!preferences || typeof preferences !== "object" || Array.isArray(preferences)) { cache.set(userId, { expiresAt: Date.now() + CACHE_MS, preferences: neutralPreferences }); return neutralPreferences; }
  const next = preferences as typeof neutralPreferences;
  cache.set(userId, { expiresAt: Date.now() + CACHE_MS, preferences: next });
  return next;
}

export function invalidateAccountPreferences(userId: string) { cache.delete(userId); }
