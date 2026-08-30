export type CosmicPlan = "free" | "cosmic_plus";
export type CosmicEntitlementSource = "account" | "admin-override" | "development-override";
export type CosmicLimit = "garage.activeVehicles" | "finance.connectedInstitutions";

export type CosmicFeature =
  | "sports.basic" | "sports.advanced"
  | "finance.basic" | "finance.recurring" | "finance.budgets" | "finance.forecasting" | "finance.analytics"
  | "context.basic" | "context.full"
  | "garage.basic" | "garage.advanced"
  | "school.basic" | "school.advanced"
  | "calendar.basic" | "calendar.multi_connection"
  | "mail.basic" | "mail.advanced"
  | "music.basic" | "ambient.basic" | "ambient.advanced"
  | "notes.basic" | "projects.basic" | "clock.basic" | "weather.basic" | "search.basic";

export type CosmicFeatureEntitlements = Record<CosmicFeature, boolean>;
export type CosmicLimitEntitlements = Record<CosmicLimit, number | null>;

export interface CosmicAdPolicy {
  adEligible: boolean;
  thirdPartyAds: boolean;
}

export interface CosmicEntitlements {
  plan: CosmicPlan;
  features: CosmicFeatureEntitlements;
  limits: CosmicLimitEntitlements;
  ads: CosmicAdPolicy;
  source: CosmicEntitlementSource;
}

const featureNames: CosmicFeature[] = [
  "sports.basic", "sports.advanced", "finance.basic", "finance.recurring", "finance.budgets", "finance.forecasting", "finance.analytics", "context.basic", "context.full", "garage.basic", "garage.advanced", "school.basic", "school.advanced", "calendar.basic", "calendar.multi_connection", "mail.basic", "mail.advanced", "music.basic", "ambient.basic", "ambient.advanced", "notes.basic", "projects.basic", "clock.basic", "weather.basic", "search.basic",
];

function featuresForPlan(plan: CosmicPlan): CosmicFeatureEntitlements {
  // Finance's local-first ledger, expected items, and basic category budgets are
  // core recordkeeping. Paid access is reserved for future forecasting/analytics
  // surfaces rather than blocking the user's own records.
  return Object.fromEntries(featureNames.map((feature) => [feature, !feature.startsWith("school.") && (plan === "cosmic_plus" || !feature.includes("advanced") && !["finance.forecasting", "finance.analytics", "calendar.multi_connection", "mail.advanced"].includes(feature))])) as CosmicFeatureEntitlements;
}

function limitsForPlan(plan: CosmicPlan): CosmicLimitEntitlements {
  return { "garage.activeVehicles": plan === "cosmic_plus" ? null : 3, "finance.connectedInstitutions": plan === "cosmic_plus" ? 10 : 1 };
}

export function entitlementsForPlan(plan: CosmicPlan, source: CosmicEntitlementSource = "account"): CosmicEntitlements {
  const plus = plan === "cosmic_plus";
  return { plan, features: featuresForPlan(plan), limits: limitsForPlan(plan), ads: { adEligible: !plus, thirdPartyAds: !plus }, source };
}

export const freeEntitlements = entitlementsForPlan("free", "account");
export const cosmicPlusEntitlements = entitlementsForPlan("cosmic_plus");

export function hasEntitlement(entitlements: CosmicEntitlements, feature: CosmicFeature): boolean {
  return entitlements.features[feature] === true;
}

export function canUseFeature(entitlements: CosmicEntitlements, feature: CosmicFeature): boolean {
  return hasEntitlement(entitlements, feature);
}
