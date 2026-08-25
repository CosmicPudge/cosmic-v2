import type { FinanceTransactionDirection, FinanceTransactionStatus } from "@/core/contracts/Finance";

export type FinancialProviderEnvironment = "sandbox" | "development" | "production";

export type FinancialProviderCapabilities = {
  supportsAccounts: boolean;
  supportsBalances: boolean;
  supportsTransactions: boolean;
  supportsRecurring: boolean;
  supportsWebhooks: boolean;
  supportsOAuth: boolean;
  supportsManualVerification: boolean;
  supportsRefresh: boolean;
  supportsDisconnect: boolean;
  supportsInstitutionSearch: boolean;
};

export type FinancialProviderErrorCode = "institution_not_supported" | "authentication_required" | "reconnect_required" | "provider_unavailable" | "provider_configuration_missing" | "rate_limited" | "temporary_error" | "permission_denied";

export type ProviderInstitution = { providerInstitutionId: string; name: string; url?: string; countryCodes?: string[]; capabilities?: string[] };

export type ProviderAccount = {
  providerAccountId: string;
  name: string;
  type: "checking" | "savings" | "cash" | "credit" | "loan" | "investment" | "other";
  subtype?: string;
  mask?: string;
  currency: string;
  currentBalanceMinor?: number;
  availableBalanceMinor?: number;
  creditLimitMinor?: number;
};

export type ProviderTransaction = {
  providerTransactionId: string;
  pendingProviderTransactionId?: string;
  providerAccountId: string;
  postedDate?: string;
  authorizedDate?: string;
  description: string;
  merchant?: string;
  amountMinor: number;
  direction: FinanceTransactionDirection;
  status: FinanceTransactionStatus;
  providerCategory?: string;
  paymentChannel?: string;
  currency: string;
};

export type FinancialDataProvider = {
  readonly name: string;
  readonly environment: FinancialProviderEnvironment;
  readonly capabilities: FinancialProviderCapabilities;
  createConnectionSession(input: { userId: string; webhookUrl: string }): Promise<{ linkToken: string; expiration?: string }>;
  exchangeConnectionToken(publicToken: string): Promise<{ accessToken: string; providerConnectionId: string; institutionId?: string; institutionName?: string }>;
  getAccounts(accessToken: string): Promise<ProviderAccount[]>;
  syncTransactions(accessToken: string, cursor?: string): Promise<{ added: ProviderTransaction[]; modified: ProviderTransaction[]; removedProviderTransactionIds: string[]; nextCursor: string; hasMore: boolean }>;
  disconnect(accessToken: string): Promise<void>;
  searchInstitutions?(query: string): Promise<ProviderInstitution[]>;
};

export function minorFromProviderAmount(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error("Provider returned an invalid amount.");
  const minor = Math.round(Math.abs(value) * 100);
  if (!Number.isSafeInteger(minor)) throw new Error("Provider returned an unsafe amount.");
  return minor;
}
