import "server-only";
import { and, eq } from "drizzle-orm";
import { getDatabase } from "@/services/database/client";
import { schoolAssets } from "@/services/database/schema";
export async function createSchoolAsset(input: typeof schoolAssets.$inferInsert) { return (await getDatabase().insert(schoolAssets).values(input).returning())[0] ?? null; }
export async function getSchoolAsset(accountId: string, sourceId: string) { return (await getDatabase().select().from(schoolAssets).where(and(eq(schoolAssets.userId, accountId), eq(schoolAssets.sourceId, sourceId))).limit(1))[0] ?? null; }
export async function deleteSchoolAsset(accountId: string, sourceId: string) { return (await getDatabase().delete(schoolAssets).where(and(eq(schoolAssets.userId, accountId), eq(schoolAssets.sourceId, sourceId))).returning())[0] ?? null; }
export async function getSchoolAssetById(accountId: string, id: string) { return (await getDatabase().select().from(schoolAssets).where(and(eq(schoolAssets.userId, accountId), eq(schoolAssets.id, id))).limit(1))[0] ?? null; }
export async function deleteSchoolAssetById(accountId: string, id: string) { return (await getDatabase().delete(schoolAssets).where(and(eq(schoolAssets.userId, accountId), eq(schoolAssets.id, id))).returning())[0] ?? null; }
