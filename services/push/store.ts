import "server-only";

import { and, eq, lt, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { getDatabase } from "@/services/database/client";
import { pushDeliveries, pushSubscriptions } from "@/services/database/schema";
import type { ValidPushSubscription } from "./validation";

export async function registerPushSubscription(userId: string, subscription: ValidPushSubscription, userAgent?: string | null, deviceLabel?: string | null) {
  const database = getDatabase();
  const now = new Date();
  const id = randomUUID();
  const [row] = await database.insert(pushSubscriptions).values({ id, userId, endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, status: "active", userAgent: userAgent?.slice(0, 500) ?? null, deviceLabel, createdAt: now, updatedAt: now }).onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: { userId, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, status: "active", userAgent: userAgent?.slice(0, 500) ?? null, deviceLabel, updatedAt: now, failureCode: null } }).returning({ id: pushSubscriptions.id });
  return row?.id ?? id;
}

export async function removePushSubscription(userId: string, endpoint: string) {
  const result = await getDatabase().update(pushSubscriptions).set({ status: "inactive", updatedAt: new Date() }).where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint))).returning({ id: pushSubscriptions.id });
  return Boolean(result[0]);
}

export async function getPushStatus(userId: string, endpoint?: string) {
  const database = getDatabase();
  if (!endpoint) return { registered: false };
  const row = await database.select({ id: pushSubscriptions.id, status: pushSubscriptions.status }).from(pushSubscriptions).where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint))).limit(1);
  return { registered: row[0]?.status === "active" };
}

export async function getActivePushSubscriptions(userId: string) {
  return getDatabase().select({ id: pushSubscriptions.id, endpoint: pushSubscriptions.endpoint, p256dh: pushSubscriptions.p256dh, auth: pushSubscriptions.auth }).from(pushSubscriptions).where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.status, "active")));
}

export async function getActivePushUserIds() {
  return getDatabase().selectDistinct({ userId: pushSubscriptions.userId }).from(pushSubscriptions).where(eq(pushSubscriptions.status, "active"));
}

export async function claimPushDelivery(signalId: string, subscriptionId: string, category: string, eventId?: string, sport?: string, title?: string, body?: string, route?: string) {
  const database = getDatabase();
  const now = new Date();
  const id = randomUUID();
  const [row] = await database.insert(pushDeliveries).values({ id, signalId, subscriptionId, category, eventId: eventId ?? null, sport: sport ?? null, title: title ?? null, body: body ?? null, route: route ?? null, status: "sending", attemptCount: 1, firstAttemptAt: now, lastAttemptAt: now, updatedAt: now }).onConflictDoNothing({ target: [pushDeliveries.signalId, pushDeliveries.subscriptionId] }).returning();
  if (row) return row;

  const [existing] = await database.select({ id: pushDeliveries.id, status: pushDeliveries.status, attemptCount: pushDeliveries.attemptCount, lastAttemptAt: pushDeliveries.lastAttemptAt }).from(pushDeliveries).where(and(eq(pushDeliveries.signalId, signalId), eq(pushDeliveries.subscriptionId, subscriptionId))).limit(1);
  if (!existing || existing.attemptCount >= 3 || !existing.lastAttemptAt) return null;
  const retryAfter = existing.status === "sending" ? 10 * 60_000 : 5 * 60_000;
  if (now.getTime() - existing.lastAttemptAt.getTime() < retryAfter) return null;
  if (existing.status !== "sending" && existing.status !== "temporary_failure") return null;
  const [retry] = await database.update(pushDeliveries).set({ status: "sending", attemptCount: sql`${pushDeliveries.attemptCount} + 1`, lastAttemptAt: now, updatedAt: now }).where(and(eq(pushDeliveries.id, existing.id), eq(pushDeliveries.status, existing.status), eq(pushDeliveries.attemptCount, existing.attemptCount), lt(pushDeliveries.lastAttemptAt, new Date(existing.lastAttemptAt.getTime() + retryAfter)))).returning();
  return retry ?? null;
}

export async function completePushDelivery(id: string, status: "delivered" | "temporary_failure" | "permanent_failure", providerCode?: number) {
  const now = new Date();
  await getDatabase().update(pushDeliveries).set({ status, providerCode: providerCode ?? null, deliveredAt: status === "delivered" ? now : null, lastAttemptAt: now, updatedAt: now }).where(eq(pushDeliveries.id, id));
}

export async function markPushSubscriptionFailure(id: string, status: "inactive" | "expired", failureCode: string) {
  const now = new Date();
  await getDatabase().update(pushSubscriptions).set({ status, lastFailureAt: now, failureCode: failureCode.slice(0, 120), updatedAt: now }).where(eq(pushSubscriptions.id, id));
}

export async function markPushSubscriptionSuccess(id: string) {
  const now = new Date();
  await getDatabase().update(pushSubscriptions).set({ lastSuccessAt: now, failureCode: null, updatedAt: now }).where(eq(pushSubscriptions.id, id));
}
