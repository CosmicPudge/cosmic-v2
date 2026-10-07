import { createHash } from "node:crypto";
import { DONUT_CONFIG, DONUT_PRODUCTS } from "./config.ts";
import { canonicalPhone, isCalendarDate, isPositiveInteger, isCutoffOpen, validateOrderQuantities } from "./domain.ts";

export class DonutOrderError extends Error {
  readonly code: "invalid" | "conflict" | "disabled" | "unavailable";

  constructor(code: "invalid" | "conflict" | "disabled" | "unavailable", message: string) {
    super(message);
    this.code = code;
  }
}

export type CreatePendingDonutOrderInput = {
  idempotencyKey: string;
  deliveryDate: string;
  deliveryWindow: string;
  quantities: unknown;
  fullName: string;
  email: string;
  phone: string;
  streetAddress: string;
  unit?: string | null;
  deliveryInstructions?: string | null;
  smsConsent: boolean;
};

export type OrderConfig = typeof DONUT_CONFIG;

function fingerprint(input: CreatePendingDonutOrderInput, quantities: Record<string, number>, phoneE164: string): string {
  return createHash("sha256").update(JSON.stringify({ ...input, quantities, phone: phoneE164 })).digest("hex");
}

function assertConfig(config: OrderConfig): void {
  if (!Number.isFinite(config.taxRate) || config.taxRate < 0) throw new DonutOrderError("invalid", "Tax configuration must be a finite nonnegative number.");
  if (!Number.isInteger(config.capacityPerBatch) || config.capacityPerBatch < 0) throw new DonutOrderError("invalid", "Capacity configuration must be a finite nonnegative integer.");
  if (!Number.isFinite(config.deliveryFeeCents) || config.deliveryFeeCents < 0 || !Number.isInteger(config.deliveryFeeCents)) throw new DonutOrderError("invalid", "Delivery fee configuration must be a finite nonnegative integer.");
}

export function validateCreatePendingDonutOrderInput(input: CreatePendingDonutOrderInput, config: OrderConfig = DONUT_CONFIG) {
  assertConfig(config);
  if (!input || typeof input !== "object") throw new DonutOrderError("invalid", "A JSON order object is required.");
  const idempotencyKey = input.idempotencyKey.trim();
  if (!idempotencyKey || idempotencyKey.length > 160) throw new DonutOrderError("invalid", "A bounded idempotency key is required.");
  if (!isCalendarDate(input.deliveryDate)) throw new DonutOrderError("invalid", "Choose a real calendar date.");
  const weekday = new Date(`${input.deliveryDate}T00:00:00Z`).getUTCDay();
  if (weekday !== 0 && weekday !== 6) throw new DonutOrderError("invalid", "Donuts are delivered on Saturday or Sunday only.");
  if (config.availableDates.length === 0 || !config.availableDates.includes(input.deliveryDate)) throw new DonutOrderError("unavailable", "That delivery date is not published.");
  if (config.deliveryWindows.length === 0 || !config.deliveryWindows.includes(input.deliveryWindow)) throw new DonutOrderError("unavailable", "That delivery window is not available.");
  if (!isCutoffOpen(input.deliveryDate, new Date())) throw new DonutOrderError("unavailable", "Ordering is closed for that weekend.");
  let quantities: Record<string, number>;
  try {
    quantities = validateOrderQuantities(input.quantities);
  } catch {
    throw new DonutOrderError("invalid", "Each requested quantity must be a positive integer.");
  }
  const items = Object.entries(quantities).map(([productId, quantity]) => {
    const product = DONUT_PRODUCTS.find((candidate) => candidate.id === productId && candidate.available);
    if (!product || !isPositiveInteger(product.priceCents)) throw new DonutOrderError("invalid", `Product ${productId} is not available.`);
    return { productId, quantity, purchasedName: product.name, purchasedPriceCents: product.priceCents };
  });
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const streetAddress = input.streetAddress.trim();
  if (!fullName || !/^\S+@\S+\.\S+$/.test(email) || !streetAddress) throw new DonutOrderError("invalid", "Name, email, and street address are required.");
  const phoneE164 = canonicalPhone(input.phone);
  if (!phoneE164) throw new DonutOrderError("invalid", "A valid 10-digit phone number is required.");
  if (input.smsConsent !== true && input.smsConsent !== false) throw new DonutOrderError("invalid", "SMS consent must be explicit.");
  const reservationQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalCents = items.reduce((sum, item) => sum + item.quantity * item.purchasedPriceCents, 0);
  const taxCents = Math.round(subtotalCents * config.taxRate);
  return { idempotencyKey, deliveryDate: input.deliveryDate, deliveryWindow: input.deliveryWindow, items, quantities, fullName, email, phoneE164, streetAddress, unit: input.unit?.trim() || null, deliveryInstructions: input.deliveryInstructions?.trim() || null, smsConsent: input.smsConsent, reservationQuantity, subtotalCents, deliveryFeeCents: config.deliveryFeeCents, taxCents, totalCents: subtotalCents + config.deliveryFeeCents + taxCents, requestFingerprint: fingerprint(input, quantities, phoneE164) };
}
