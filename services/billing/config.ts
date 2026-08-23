import "server-only";

export interface BillingConfiguration {
  checkoutConfigured: boolean;
  webhookConfigured: boolean;
  configured: boolean;
  testMode: boolean;
  missing: string[];
}

export function getBillingConfiguration(): BillingConfiguration {
  const missing = [
    !process.env.STRIPE_SECRET_KEY ? "STRIPE_SECRET_KEY" : null,
    !process.env.STRIPE_WEBHOOK_SECRET ? "STRIPE_WEBHOOK_SECRET" : null,
    !process.env.STRIPE_COSMIC_PLUS_PRICE_ID ? "STRIPE_COSMIC_PLUS_PRICE_ID" : null,
  ].filter((value): value is string => Boolean(value));
  const checkoutConfigured = !missing.includes("STRIPE_SECRET_KEY") && !missing.includes("STRIPE_COSMIC_PLUS_PRICE_ID") && !missing.includes("STRIPE_WEBHOOK_SECRET");
  const webhookConfigured = !missing.includes("STRIPE_SECRET_KEY") && !missing.includes("STRIPE_WEBHOOK_SECRET");
  return { checkoutConfigured, webhookConfigured, configured: checkoutConfigured, testMode: process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") === true, missing };
}
