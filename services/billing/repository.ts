import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDatabase } from "@/services/database/client";
import { billingSubscriptions, billingWebhookEvents } from "@/services/database/schema";
import type { BillingSubscriptionRecord, BillingSubscriptionStatus } from "./contracts";

function toRecord(row: typeof billingSubscriptions.$inferSelect): BillingSubscriptionRecord {
  return { ...row, provider: "stripe", status: row.status as BillingSubscriptionStatus };
}

export async function getBillingSubscription(userId: string) {
  const rows = await getDatabase().select().from(billingSubscriptions).where(and(eq(billingSubscriptions.userId, userId), eq(billingSubscriptions.provider, "stripe"))).limit(1);
  return rows[0] ? toRecord(rows[0]) : null;
}

export async function findBillingSubscription(input: { providerCustomerId?: string | null; providerSubscriptionId?: string | null }) {
  const predicates = [];
  if (input.providerCustomerId) predicates.push(eq(billingSubscriptions.providerCustomerId, input.providerCustomerId));
  if (input.providerSubscriptionId) predicates.push(eq(billingSubscriptions.providerSubscriptionId, input.providerSubscriptionId));
  if (!predicates.length) return null;
  const rows = await getDatabase().select().from(billingSubscriptions).where(and(...predicates)).limit(1);
  return rows[0] ? toRecord(rows[0]) : null;
}

export async function upsertBillingSubscription(input: Omit<BillingSubscriptionRecord, "id" | "createdAt" | "updatedAt" | "provider" | "lastEventCreated" | "lastEventId"> & { id?: string; lastEventCreated?: number | null; lastEventId?: string | null }) {
  const database = getDatabase();
  const existing = await getBillingSubscription(input.userId);
  const values = { ...input, provider: "stripe" as const, lastEventCreated: input.lastEventCreated ?? existing?.lastEventCreated ?? null, lastEventId: input.lastEventId ?? existing?.lastEventId ?? null, ...(input.id ? { id: input.id } : {}), updatedAt: new Date() };
  if (existing) {
    const rows = await database.update(billingSubscriptions).set(values).where(eq(billingSubscriptions.id, existing.id)).returning();
    return rows[0] ? toRecord(rows[0]) : { ...existing, ...values } as BillingSubscriptionRecord;
  }
  const rows = await database.insert(billingSubscriptions).values({ id: input.id ?? randomUUID(), ...values }).returning();
  return toRecord(rows[0]);
}

export async function markBillingWebhookProcessed(eventId: string, eventType: string) {
  const rows = await getDatabase().insert(billingWebhookEvents).values({ eventId, eventType }).onConflictDoNothing({ target: billingWebhookEvents.eventId }).returning({ eventId: billingWebhookEvents.eventId });
  return Boolean(rows[0]);
}

export async function hasBillingWebhookProcessed(eventId: string) {
  const rows = await getDatabase().select({ eventId: billingWebhookEvents.eventId }).from(billingWebhookEvents).where(eq(billingWebhookEvents.eventId, eventId)).limit(1);
  return Boolean(rows[0]);
}

export async function getLastBillingWebhook() {
  const rows = await getDatabase().select().from(billingWebhookEvents).orderBy(desc(billingWebhookEvents.processedAt)).limit(1);
  return rows[0] ?? null;
}
