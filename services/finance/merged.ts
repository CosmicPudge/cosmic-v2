import type { FinanceAccount, FinanceAccountType, FinanceCategory, FinanceTransaction } from "@/core/contracts/Finance";

export type ConnectedFinanceAccount = {
  id: string;
  name: string;
  type: string;
  subtype?: string | null;
  institutionName?: string | null;
  provider: string;
  currentBalanceMinor?: number | null;
  availableBalanceMinor?: number | null;
  creditLimitMinor?: number | null;
  mask?: string | null;
  status: string;
  connectionStatus?: string;
  lastUpdatedAt?: string | null;
};

export type UnifiedFinanceAccount = {
  id: string;
  source: "manual" | "connected";
  name: string;
  type: FinanceAccountType;
  institution?: string;
  currentBalanceMinor: number;
  availableBalanceMinor?: number;
  creditLimitMinor?: number;
  maskedIdentifier?: string;
  connectionStatus?: string;
  lastSync?: string;
  provider?: string;
  isLive: boolean;
};

function connectedAccountType(type: string, subtype?: string | null): FinanceAccountType {
  const normalized = `${type} ${subtype ?? ""}`.toLowerCase();
  if (normalized.includes("credit") || normalized.includes("loan") || normalized.includes("debt")) return "credit";
  if (normalized.includes("savings")) return "savings";
  if (normalized.includes("checking") || normalized.includes("depository") || normalized.includes("cash")) return "checking";
  return "other";
}

export function mergeFinanceAccounts(manual: FinanceAccount[], connected: ConnectedFinanceAccount[], balances: Map<string, number>): UnifiedFinanceAccount[] {
  const manualAccounts = manual.filter((account) => !account.archived).map((account) => ({
    id: account.id,
    source: "manual" as const,
    name: account.name,
    type: account.type,
    ...(account.institution ? { institution: account.institution } : {}),
    currentBalanceMinor: balances.get(account.id) ?? account.startingBalanceMinor,
    isLive: true,
  }));
  const connectedAccounts = connected.map((account) => {
    const connectionStatus = account.connectionStatus ?? account.status;
    return {
      id: `connected:${account.id}`,
      source: "connected" as const,
      name: account.name,
      type: connectedAccountType(account.type, account.subtype),
      ...(account.institutionName ? { institution: account.institutionName } : {}),
      currentBalanceMinor: account.currentBalanceMinor ?? 0,
      ...(account.availableBalanceMinor !== null && account.availableBalanceMinor !== undefined ? { availableBalanceMinor: account.availableBalanceMinor } : {}),
      ...(account.creditLimitMinor !== null && account.creditLimitMinor !== undefined ? { creditLimitMinor: account.creditLimitMinor } : {}),
      ...(account.mask ? { maskedIdentifier: account.mask } : {}),
      connectionStatus,
      ...(account.lastUpdatedAt ? { lastSync: account.lastUpdatedAt } : {}),
      provider: account.provider,
      isLive: connectionStatus === "connected" && account.status !== "disconnected",
    };
  });
  return [...manualAccounts, ...connectedAccounts];
}

export function getUnifiedAccountTotals(accounts: UnifiedFinanceAccount[]) {
  const live = accounts.filter((account) => account.source === "manual" || account.isLive);
  const assetsMinor = live.filter((account) => account.type !== "credit").reduce((sum, account) => sum + account.currentBalanceMinor, 0);
  const liabilitiesMinor = live.filter((account) => account.type === "credit").reduce((sum, account) => sum + Math.abs(account.currentBalanceMinor), 0);
  const availableCashMinor = live.filter((account) => account.type === "checking" || account.type === "savings" || account.type === "cash").reduce((sum, account) => sum + (account.availableBalanceMinor ?? account.currentBalanceMinor), 0);
  return { assetsMinor, liabilitiesMinor, netWorthMinor: assetsMinor - liabilitiesMinor, availableCashMinor };
}

export type ConnectedFinanceTransaction = {
  id: string;
  externalAccountId: string;
  date?: string | null;
  description: string;
  merchant?: string | null;
  amountMinor: number;
  direction: "income" | "expense" | "transfer";
  status: "pending" | "cleared";
  providerCategory?: string | null;
  categoryId?: string | null;
  ignored?: boolean;
  isSubscription?: boolean | null;
  notes?: string | null;
  source: "connected";
};

export type UnifiedFinanceTransaction = Omit<FinanceTransaction, "source"> & { source: "manual" | "import" | "connected"; externalId?: string; ignored?: boolean; isSubscription?: boolean };

function monthKey(date: string) { return date.slice(0, 7); }
function categoryForProvider(category: string | null | undefined, categories: FinanceCategory[]) {
  const normalized = (category ?? "").toLowerCase();
  if (!normalized) return categories.find((item) => item.name === "Other")?.id ?? categories[0]?.id ?? "";
  const match = categories.find((item) => normalized.includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(normalized));
  return match?.id ?? categories.find((item) => item.name === "Other")?.id ?? categories[0]?.id ?? "";
}

export function mergeFinanceTransactions(manual: FinanceTransaction[], connected: ConnectedFinanceTransaction[], categories: FinanceCategory[]): UnifiedFinanceTransaction[] {
  const connectedRecords: UnifiedFinanceTransaction[] = connected.filter((item) => !item.ignored && item.date).map((item) => ({ id: `connected:${item.id}`, externalId: item.id, accountId: `connected:${item.externalAccountId}`, date: item.date!, description: item.description, ...(item.merchant ? { merchant: item.merchant } : {}), amountMinor: item.amountMinor, direction: item.direction, categoryId: item.categoryId ?? categoryForProvider(item.providerCategory, categories), status: item.status, createdAt: item.date!, updatedAt: item.date!, source: "connected", ...(item.isSubscription !== null && item.isSubscription !== undefined ? { isSubscription: item.isSubscription } : {}) }));
  return [...manual.map((item): UnifiedFinanceTransaction => ({ ...item, source: item.source === "import" ? "import" : "manual" })), ...connectedRecords].sort((left, right) => right.date.localeCompare(left.date) || right.createdAt.localeCompare(left.createdAt));
}

export function getUnifiedMonthTotals(transactions: UnifiedFinanceTransaction[], month = new Date()) {
  const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
  return transactions.filter((item) => monthKey(item.date) === key).reduce((totals, item) => { if (item.direction === "income") totals.incomeMinor += item.amountMinor; if (item.direction === "expense") totals.expenseMinor += item.amountMinor; if (item.direction === "income") totals.netMinor += item.amountMinor; if (item.direction === "expense") totals.netMinor -= item.amountMinor; return totals; }, { incomeMinor: 0, expenseMinor: 0, netMinor: 0 });
}

export function getUnifiedCategoryTotals(transactions: UnifiedFinanceTransaction[], month = new Date()) {
  const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
  const totals = new Map<string, number>();
  transactions.forEach((item) => { if (item.direction === "expense" && monthKey(item.date) === key) totals.set(item.categoryId, (totals.get(item.categoryId) ?? 0) + item.amountMinor); });
  return totals;
}

export function detectTransferPairs(transactions: ConnectedFinanceTransaction[]) {
  const pairs: Array<{ sourceId: string; destinationId: string; confidence: number }> = [];
  const candidates = transactions.filter((item) => item.date && !item.ignored && (item.direction === "income" || item.direction === "expense"));
  candidates.forEach((item) => { const opposite = candidates.filter((other) => other.id !== item.id && other.externalAccountId !== item.externalAccountId && other.amountMinor === item.amountMinor && other.date === item.date && other.direction !== item.direction); if (opposite.length === 1 && item.direction === "expense") pairs.push({ sourceId: item.id, destinationId: opposite[0].id, confidence: 95 }); });
  return pairs;
}

export type DetectedRecurring = { key: string; merchant: string; accountId: string; amountMinor: number; cadence: "weekly" | "biweekly" | "monthly" | "yearly"; lastDate: string; nextExpectedDate: string; direction: "income" | "expense"; count: number };

export function detectRecurringActivity(transactions: ConnectedFinanceTransaction[]) {
  const groups = new Map<string, ConnectedFinanceTransaction[]>();
  transactions.filter((item) => item.date && !item.ignored && item.direction !== "transfer").forEach((item) => { const key = `${item.externalAccountId}:${(item.merchant ?? item.description).toLowerCase()}:${item.direction}`; groups.set(key, [...(groups.get(key) ?? []), item]); });
  return [...groups.entries()].flatMap(([key, items]): DetectedRecurring[] => { if (items.length < 3) return []; const sorted = [...items].sort((a, b) => a.date!.localeCompare(b.date!)); const intervals = sorted.slice(1).map((item, index) => Math.round((new Date(`${item.date}T12:00:00`).getTime() - new Date(`${sorted[index].date}T12:00:00`).getTime()) / 86_400_000)); const average = intervals.reduce((sum, value) => sum + value, 0) / intervals.length; const cadence = average <= 9 ? "weekly" : average <= 18 ? "biweekly" : average <= 45 ? "monthly" : average <= 400 ? "yearly" : null; if (!cadence) return []; const next = new Date(`${sorted.at(-1)!.date}T12:00:00`); if (cadence === "weekly") next.setDate(next.getDate() + 7); if (cadence === "biweekly") next.setDate(next.getDate() + 14); if (cadence === "monthly") next.setMonth(next.getMonth() + 1); if (cadence === "yearly") next.setFullYear(next.getFullYear() + 1); return [{ key, merchant: sorted.at(-1)!.merchant ?? sorted.at(-1)!.description, accountId: sorted.at(-1)!.externalAccountId, amountMinor: Math.round(sorted.reduce((sum, item) => sum + item.amountMinor, 0) / sorted.length), cadence, lastDate: sorted.at(-1)!.date!, nextExpectedDate: next.toISOString().slice(0, 10), direction: sorted.at(-1)!.direction as "income" | "expense", count: sorted.length }]; });
}

export function calculateGoalProgress(goal: { progressMode: "manual" | "dedicated_account" | "contributions"; targetAmountMinor: number; manualAssignedMinor: number }, input: { linkedBalanceMinor?: number; contributionMinor?: number }) {
  const progressMinor = goal.progressMode === "dedicated_account" ? input.linkedBalanceMinor ?? 0 : goal.progressMode === "contributions" ? input.contributionMinor ?? 0 : goal.manualAssignedMinor;
  const safeProgress = Math.max(0, Math.min(goal.targetAmountMinor, progressMinor));
  return { progressMinor: safeProgress, remainingMinor: Math.max(0, goal.targetAmountMinor - safeProgress), percent: goal.targetAmountMinor > 0 ? safeProgress / goal.targetAmountMinor * 100 : 0 };
}

export function requiredMonthlyContribution(remainingMinor: number, targetDate?: string, now = new Date()) { if (!targetDate) return null; const target = new Date(`${targetDate}T12:00:00`); const months = Math.max(1, (target.getFullYear() - now.getFullYear()) * 12 + target.getMonth() - now.getMonth()); return Math.ceil(remainingMinor / months); }
