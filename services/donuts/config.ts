import type { ProductionStage } from "./domain.ts";
import { isCalendarDate, isNonNegativeInteger } from "./domain.ts";

function configuredNonNegativeInteger(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!isNonNegativeInteger(value)) throw new Error(`${name} must be a finite nonnegative integer.`);
  return value;
}

function configuredList(name: string): string[] {
  return (process.env[name] ?? "").split(",").map((value) => value.trim()).filter(Boolean);
}

function configuredCalendarDates(name: string): string[] {
  const values = configuredList(name);
  if (values.some((value) => !isCalendarDate(value))) throw new Error(`${name} must contain only real YYYY-MM-DD calendar dates.`);
  return values;
}

export const DONUT_CONFIG = {
  enabled: process.env.DONUTS_ORDERING_ENABLED === "true",
  paymentsConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
  smsConfigured: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER),
  cutoffLabel: "Thursday at 3:00 p.m. (development placeholder)",
  deliveryFeeCents: configuredNonNegativeInteger("DONUTS_DELIVERY_FEE_CENTS", 0),
  taxRate: Number(process.env.DONUTS_TAX_RATE ?? 0),
  capacityPerBatch: configuredNonNegativeInteger("DONUTS_CAPACITY_PER_BATCH", 48),
  availableDates: configuredCalendarDates("DONUTS_AVAILABLE_DATES"),
  deliveryWindows: configuredList("DONUTS_DELIVERY_WINDOWS"),
  defaultWindow: "9:00–11:00 a.m.",
} as const;

export const DONUT_PRODUCTS = [
  { id: "original-glaze", name: "Original Glaze", description: "A proposed classic glaze profile.", priceCents: 320, allergens: ["proposed"], available: true, accent: "violet" },
  { id: "chocolate-orbit", name: "Chocolate Orbit", description: "A proposed chocolate-glazed flavor.", priceCents: 380, allergens: ["proposed"], available: true, accent: "plum" },
  { id: "nutella-pumpkin", name: "Nutella Pumpkin", description: "A proposed pumpkin and hazelnut flavor.", priceCents: 420, allergens: ["proposed"], available: true, accent: "amber" },
] as const;

export const DONUT_STAGE_LABELS: Record<ProductionStage, string> = {
  Accepted: "Order accepted", "Preparing ingredients": "Preparing ingredients", Kneading: "Kneading dough", "First rise": "First rise", Shaping: "Shaping", "Second rise": "Second rise", Frying: "Frying", Cooling: "Cooling", "Glazing / Filling": "Glazing / filling", Setting: "Setting", "Out for delivery": "Out for delivery", Delivered: "Delivered",
};

export function money(cents: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100); }
