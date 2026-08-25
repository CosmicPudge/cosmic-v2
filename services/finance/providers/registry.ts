import "server-only";

import type { FinancialDataProvider, FinancialProviderCapabilities, FinancialProviderEnvironment, ProviderInstitution } from "./types";
import { getPlaidFinancialProvider } from "./plaid";

export type ProviderHealth = "configured" | "not_configured" | "sandbox_only" | "production_pending" | "available" | "degraded";
export type ProviderDescriptor = { id: string; displayName: string; environment: FinancialProviderEnvironment | "unavailable"; priority: number; configured: boolean; health: ProviderHealth; capabilities: FinancialProviderCapabilities; institutionSearchAvailable: boolean; connectionAvailable: boolean; adapter?: FinancialDataProvider };

const unavailableCapabilities: FinancialProviderCapabilities = { supportsAccounts: false, supportsBalances: false, supportsTransactions: false, supportsRecurring: false, supportsWebhooks: false, supportsOAuth: false, supportsManualVerification: false, supportsRefresh: false, supportsDisconnect: false, supportsInstitutionSearch: false };
const mxCapabilities: FinancialProviderCapabilities = { ...unavailableCapabilities, supportsAccounts: true, supportsBalances: true, supportsTransactions: true, supportsRecurring: true, supportsOAuth: true, supportsDisconnect: true, supportsInstitutionSearch: true, supportsWebhooks: true };
const finicityCapabilities: FinancialProviderCapabilities = { ...unavailableCapabilities, supportsAccounts: true, supportsBalances: true, supportsTransactions: true, supportsOAuth: true, supportsDisconnect: true, supportsInstitutionSearch: true, supportsWebhooks: true };

function configuredPlaid(): ProviderDescriptor {
  const configured = Boolean(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
  if (!configured) return { id: "plaid", displayName: "Plaid", environment: "unavailable", priority: 1, configured: false, health: "not_configured", capabilities: unavailableCapabilities, institutionSearchAvailable: false, connectionAvailable: false };
  try { const adapter = getPlaidFinancialProvider(); return { id: "plaid", displayName: "Plaid", environment: adapter.environment, priority: 1, configured: true, health: adapter.environment === "production" ? "available" : "sandbox_only", capabilities: adapter.capabilities, institutionSearchAvailable: true, connectionAvailable: true, adapter }; } catch { return { id: "plaid", displayName: "Plaid", environment: "unavailable", priority: 1, configured: false, health: "not_configured", capabilities: unavailableCapabilities, institutionSearchAvailable: false, connectionAvailable: false }; }
}

function disabledDescriptor(id: "mx" | "finicity", displayName: string, capabilities: FinancialProviderCapabilities): ProviderDescriptor {
  const configured = id === "mx" ? Boolean(process.env.MX_CLIENT_ID && process.env.MX_API_KEY) : Boolean(process.env.FINICITY_PARTNER_ID && process.env.FINICITY_APP_KEY && process.env.FINICITY_SECRET);
  return { id, displayName, environment: configured ? ((process.env[`${id.toUpperCase()}_ENV`] ?? "development") as FinancialProviderEnvironment) : "unavailable", priority: id === "mx" ? 2 : 3, configured, health: configured ? "production_pending" : "not_configured", capabilities, institutionSearchAvailable: false, connectionAvailable: false };
}

export function getFinancialProviderRegistry(): ProviderDescriptor[] { return [configuredPlaid(), disabledDescriptor("mx", "MX", mxCapabilities), disabledDescriptor("finicity", "Mastercard Open Finance / Finicity", finicityCapabilities)].sort((a, b) => a.priority - b.priority); }
export function publicProviderDescriptor(provider: ProviderDescriptor) { return { id: provider.id, displayName: provider.displayName, environment: provider.environment, priority: provider.priority, configured: provider.configured, health: provider.health, capabilities: provider.capabilities, institutionSearchAvailable: provider.institutionSearchAvailable, connectionAvailable: provider.connectionAvailable }; }
export function getConfiguredFinancialProviders() { return getFinancialProviderRegistry().filter((provider) => provider.configured && provider.adapter); }

export async function searchFinancialInstitutions(query: string): Promise<Array<ProviderInstitution & { provider: string; providerDisplayName: string; health: ProviderHealth }>> {
  const clean = query.trim(); if (clean.length < 3) return [];
  const results = await Promise.all(getConfiguredFinancialProviders().filter((provider) => provider.institutionSearchAvailable && provider.adapter?.searchInstitutions).map(async (provider) => (await provider.adapter!.searchInstitutions!(clean)).map((institution) => ({ ...institution, provider: provider.id, providerDisplayName: provider.displayName, health: provider.health }))));
  const deduped = new Map<string, Array<ProviderInstitution & { provider: string; providerDisplayName: string; health: ProviderHealth }>>();
  results.flat().forEach((item) => { const key = item.name.toLocaleLowerCase().replace(/[^a-z0-9]/g, ""); deduped.set(key, [...(deduped.get(key) ?? []), item]); });
  return [...deduped.values()].flat().sort((a, b) => a.name.localeCompare(b.name) || a.provider.localeCompare(b.provider));
}
