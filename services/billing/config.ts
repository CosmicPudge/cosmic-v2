import "server-only";

export interface BillingConfiguration {
  checkoutConfigured: boolean;
  webhookConfigured: boolean;
  configured: boolean;
  testMode: boolean;
  environment: "test" | "live" | "unknown";
  modeMismatch: boolean;
  liveModeBlocked: boolean;
  missing: string[];
}

export function getBillingConfiguration(): BillingConfiguration {
  const missing = [
    !process.env.STRIPE_SECRET_KEY ? "STRIPE_SECRET_KEY" : null,
    !process.env.STRIPE_WEBHOOK_SECRET ? "STRIPE_WEBHOOK_SECRET" : null,
    !process.env.STRIPE_COSMIC_PLUS_PRICE_ID ? "STRIPE_COSMIC_PLUS_PRICE_ID" : null,
  ].filter((value): value is string => Boolean(value));
  const keyMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") ? "test" : process.env.STRIPE_SECRET_KEY?.startsWith("sk_live_") ? "live" : "unknown";
  const configuredMode = process.env.STRIPE_ENVIRONMENT === "test" || process.env.STRIPE_ENVIRONMENT === "live" ? process.env.STRIPE_ENVIRONMENT : keyMode;
  const modeMismatch = configuredMode !== "unknown" && keyMode !== "unknown" && configuredMode !== keyMode;
  const liveModeBlocked = configuredMode === "live" && process.env.NODE_ENV !== "production";
  const checkoutConfigured = !missing.includes("STRIPE_SECRET_KEY") && !missing.includes("STRIPE_COSMIC_PLUS_PRICE_ID") && !modeMismatch && !liveModeBlocked;
  const webhookConfigured = !missing.includes("STRIPE_SECRET_KEY") && !missing.includes("STRIPE_WEBHOOK_SECRET") && !modeMismatch && !liveModeBlocked;
  return { checkoutConfigured, webhookConfigured, configured: checkoutConfigured, testMode: configuredMode === "test", environment: configuredMode, modeMismatch, liveModeBlocked, missing };
}
