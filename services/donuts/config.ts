import type { ProductionStage } from "./domain";

export const DONUT_CONFIG = {
  enabled: process.env.DONUTS_ORDERING_ENABLED === "true",
  paymentsConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
  smsConfigured: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER),
  cutoffLabel: "Thursday at 3:00 p.m. (development placeholder)",
  deliveryFeeCents: Number(process.env.DONUTS_DELIVERY_FEE_CENTS ?? 0),
  taxRate: Number(process.env.DONUTS_TAX_RATE ?? 0),
  capacityPerBatch: Number(process.env.DONUTS_CAPACITY_PER_BATCH ?? 48),
  defaultWindow: "9:00–11:00 a.m.",
} as const;

export const DONUT_PRODUCTS = [
  { id: "original-glaze", name: "Original Glaze", description: "Pillowy brioche, finished with a thin vanilla glaze.", priceCents: 320, allergens: ["wheat", "egg", "milk"], available: true, accent: "violet" },
  { id: "chocolate-orbit", name: "Chocolate Orbit", description: "Dark cocoa glaze with a soft, cosmic-sugar finish.", priceCents: 380, allergens: ["wheat", "egg", "milk"], available: true, accent: "plum" },
  { id: "nutella-pumpkin", name: "Nutella Pumpkin", description: "Warm pumpkin spice, hazelnut chocolate, and a little winter magic.", priceCents: 420, allergens: ["wheat", "egg", "milk", "hazelnut"], available: true, accent: "amber" },
] as const;

export const DONUT_STAGE_LABELS: Record<ProductionStage, string> = {
  Accepted: "Order accepted", "Preparing ingredients": "Preparing ingredients", Kneading: "Kneading dough", "First rise": "First rise", Shaping: "Shaping", "Second rise": "Second rise", Frying: "Frying", Cooling: "Cooling", "Glazing / Filling": "Glazing / filling", Setting: "Setting", "Out for delivery": "Out for delivery", Delivered: "Delivered",
};

export function money(cents: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100); }
