import type { ConnectedFinanceTransaction } from "@/services/finance/merged";

export const sanitizedProviderTransactions: ConnectedFinanceTransaction[] = [
  { id: "fixture-plaid-1", externalAccountId: "fixture-account-a", date: "2026-08-01", description: "Coffee Shop", merchant: "Coffee Shop", amountMinor: 550, direction: "expense", status: "cleared", providerCategory: "Food and Drink", source: "connected" },
  { id: "fixture-mx-1", externalAccountId: "fixture-account-b", date: "2026-08-01", description: "Payroll Deposit", merchant: "Payroll", amountMinor: 250000, direction: "income", status: "cleared", providerCategory: "Income", source: "connected" },
];
