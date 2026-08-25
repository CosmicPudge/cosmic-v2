export type FinanceAccountType = "checking" | "savings" | "cash" | "credit" | "other";
export type FinanceTransactionDirection = "income" | "expense" | "transfer";
export type FinanceTransactionStatus = "pending" | "cleared";
export type FinanceTransferEffect = "in" | "out";
export type FinanceRecurringCadence = "weekly" | "biweekly" | "monthly" | "yearly";

export interface FinanceAccount {
  id: string;
  name: string;
  type: FinanceAccountType;
  institution?: string;
  startingBalanceMinor: number;
  archived: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceCategory {
  id: string;
  name: string;
  system: boolean;
  archived: boolean;
  createdAt: string;
}

export interface FinanceTransaction {
  id: string;
  accountId: string;
  date: string;
  postedDate?: string;
  description: string;
  merchant?: string;
  amountMinor: number;
  direction: FinanceTransactionDirection;
  transferEffect?: FinanceTransferEffect;
  categoryId: string;
  subcategory?: string;
  notes?: string;
  status: FinanceTransactionStatus;
  createdAt: string;
  updatedAt: string;
  source?: "manual" | "import";
}

export interface FinanceRecurringItem {
  id: string;
  accountId: string;
  name: string;
  merchant?: string;
  direction: FinanceTransactionDirection;
  amountMinor: number;
  transferEffect?: FinanceTransferEffect;
  categoryId: string;
  cadence: FinanceRecurringCadence;
  nextExpectedDate: string;
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceBudget {
  id: string;
  categoryId: string;
  monthlyLimitMinor: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceSnapshot {
  version: 1;
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  transactions: FinanceTransaction[];
  recurringItems: FinanceRecurringItem[];
  budgets: FinanceBudget[];
  hideBalances: boolean;
  selectedAccountId?: string;
}
