import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import { and, eq, gt, isNull, lt, or, sql } from "drizzle-orm";
import { getDatabase } from "@/services/database/client";
import { donutBatches, donutOrderEvents, donutOrderItems, donutOrders, donutTrackingTokens } from "@/services/database/schema";
import { DONUT_CONFIG } from "./config.ts";
import { hasCapacity, isProductionStage } from "./domain.ts";
import { DonutOrderError, type CreatePendingDonutOrderInput, type OrderConfig, validateCreatePendingDonutOrderInput } from "./orderValidation.ts";
import { hashDonutTrackingToken } from "./tokens.ts";

export { DonutOrderError } from "./orderValidation.ts";
export type { CreatePendingDonutOrderInput } from "./orderValidation.ts";

function publicOrderNumber(date: string): string { return `CD-${date.replaceAll("-", "")}-${randomBytes(3).toString("hex").toUpperCase()}`; }

export async function createPendingDonutOrder(input: CreatePendingDonutOrderInput, options: { allowDisabled?: boolean; config?: OrderConfig } = {}) {
  const config = options.config ?? DONUT_CONFIG;
  if (!config.enabled && !options.allowDisabled) throw new DonutOrderError("disabled", "Cosmic Donuts ordering is disabled.");
  const validated = validateCreatePendingDonutOrderInput(input, config);
  const database = getDatabase();
  return database.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${validated.idempotencyKey}))`);
    const existing = await tx.select({ order: donutOrders, token: donutTrackingTokens }).from(donutOrders).leftJoin(donutTrackingTokens, eq(donutTrackingTokens.orderId, donutOrders.id)).where(eq(donutOrders.idempotencyKey, validated.idempotencyKey)).limit(1);
    if (existing[0]) {
      if (existing[0].order.requestFingerprint !== validated.requestFingerprint) throw new DonutOrderError("conflict", "That idempotency key was already used for different order data.");
      return { idempotent: true, orderId: existing[0].order.id, publicOrderNumber: existing[0].order.publicOrderNumber, trackingPath: null, status: existing[0].order.status };
    }

    await tx.insert(donutBatches).values({ id: randomUUID(), deliveryDate: validated.deliveryDate, capacity: config.capacityPerBatch }).onConflictDoNothing({ target: donutBatches.deliveryDate });
    const [batch] = await tx.select().from(donutBatches).where(eq(donutBatches.deliveryDate, validated.deliveryDate)).limit(1);
    if (!batch) throw new DonutOrderError("unavailable", "That delivery batch is unavailable.");
    if (batch.status !== "open") throw new DonutOrderError("unavailable", "That delivery batch is closed.");
    await tx.execute(sql`select id from donut_batches where id = ${batch.id} for update`);
    const now = new Date();
    const expired = await tx.update(donutOrders).set({ status: "expired", updatedAt: now }).where(and(eq(donutOrders.batchId, batch.id), eq(donutOrders.status, "pending_payment"), lt(donutOrders.reservationExpiresAt, now))).returning({ id: donutOrders.id, reservationQuantity: donutOrders.reservationQuantity });
    const expiredQuantity = expired.reduce((sum, order) => sum + order.reservationQuantity, 0);
    const currentReserved = Math.max(0, batch.reservedCount - expiredQuantity);
    if (!hasCapacity(currentReserved, validated.reservationQuantity, batch.capacity)) throw new DonutOrderError("conflict", "That dated batch does not have enough capacity.");
    if (expired.length) await tx.insert(donutOrderEvents).values(expired.map((order) => ({ id: randomUUID(), orderId: order.id, kind: "reservation_expired" as const, fromStatus: "pending_payment", toStatus: "expired", metadata: { reservationQuantity: order.reservationQuantity } })));
    if (expiredQuantity) await tx.update(donutBatches).set({ reservedCount: currentReserved, updatedAt: now }).where(eq(donutBatches.id, batch.id));
    await tx.update(donutBatches).set({ reservedCount: currentReserved + validated.reservationQuantity, updatedAt: now }).where(eq(donutBatches.id, batch.id));

    const orderId = randomUUID(); const trackingToken = randomBytes(32).toString("base64url"); const reservationExpiresAt = new Date(now.getTime() + batch.reservationTtlMinutes * 60 * 1000); const trackingTokenExpiresAt = new Date(Date.parse(`${validated.deliveryDate}T23:59:59Z`) + 30 * 24 * 60 * 60 * 1000);
    const [order] = await tx.insert(donutOrders).values({ id: orderId, idempotencyKey: validated.idempotencyKey, requestFingerprint: validated.requestFingerprint, publicOrderNumber: publicOrderNumber(validated.deliveryDate), batchId: batch.id, status: "pending_payment", fullName: validated.fullName, email: validated.email, phoneE164: validated.phoneE164, streetAddress: validated.streetAddress, unit: validated.unit, deliveryInstructions: validated.deliveryInstructions, deliveryWindow: validated.deliveryWindow, subtotalCents: validated.subtotalCents, deliveryFeeCents: validated.deliveryFeeCents, taxCents: validated.taxCents, totalCents: validated.totalCents, reservationQuantity: validated.reservationQuantity, reservationExpiresAt, smsConsent: validated.smsConsent, smsConsentAt: validated.smsConsent ? now : null, createdAt: now, updatedAt: now }).returning();
    if (!order) throw new DonutOrderError("conflict", "The order could not be created.");
    await tx.insert(donutOrderItems).values(validated.items.map((item) => ({ id: randomUUID(), orderId, productId: item.productId, purchasedName: item.purchasedName, purchasedPriceCents: item.purchasedPriceCents, quantity: item.quantity })));
    await tx.insert(donutTrackingTokens).values({ id: randomUUID(), orderId, tokenHash: hashDonutTrackingToken(trackingToken), expiresAt: trackingTokenExpiresAt });
    await tx.insert(donutOrderEvents).values({ id: randomUUID(), orderId, kind: "created", toStatus: "pending_payment", metadata: { reservationQuantity: validated.reservationQuantity, reservationExpiresAt: reservationExpiresAt.toISOString() } });
    return { idempotent: false, orderId, publicOrderNumber: order.publicOrderNumber, trackingPath: `/donuts/track/${trackingToken}`, status: order.status, reservationExpiresAt };
  });
}

export async function findDonutOrderByTrackingToken(rawToken: string) {
  if (!rawToken || rawToken.length < 32) return null;
  const tokenHash = hashDonutTrackingToken(rawToken); const now = new Date(); const database = getDatabase();
  const rows = await database.select({ order: donutOrders, batch: donutBatches, token: donutTrackingTokens }).from(donutTrackingTokens).innerJoin(donutOrders, eq(donutOrders.id, donutTrackingTokens.orderId)).innerJoin(donutBatches, eq(donutBatches.id, donutOrders.batchId)).where(and(eq(donutTrackingTokens.tokenHash, tokenHash), isNull(donutTrackingTokens.revokedAt), or(isNull(donutTrackingTokens.expiresAt), gt(donutTrackingTokens.expiresAt, now)))).limit(1);
  if (!rows[0]) return null;
  await database.update(donutTrackingTokens).set({ lastUsedAt: now }).where(eq(donutTrackingTokens.id, rows[0].token.id));
  return { orderId: rows[0].order.id, publicOrderNumber: rows[0].order.publicOrderNumber, status: rows[0].order.status, productionStage: isProductionStage(rows[0].order.productionStage) ? rows[0].order.productionStage : null, deliveryDate: rows[0].batch.deliveryDate, deliveryWindow: rows[0].order.deliveryWindow };
}
