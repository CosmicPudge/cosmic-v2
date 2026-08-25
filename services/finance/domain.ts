import type { FinanceAccount, FinanceBudget, FinanceRecurringCadence, FinanceRecurringItem, FinanceSnapshot, FinanceTransaction } from "@/core/contracts/Finance";

export const DEFAULT_CURRENCY = "USD";

// Balances are signed ledger values. A credit account with a balance of -$42.73
// represents recorded debt; the UI may display its absolute value as debt.

export function parseMoneyToMinor(value: string | number): number | null {
  const normalized = typeof value === "number" ? value.toString() : value.trim().replace(/[$,\s]/g, "");
  if (!normalized || !/^-?\d+(\.\d{0,2})?$/.test(normalized)) return null;
  const sign = normalized.startsWith("-") ? -1 : 1;
  const [whole, cents = ""] = normalized.replace(/^-/, "").split(".");
  const amount = sign * (Number(whole) * 100 + Number(cents.padEnd(2, "0")));
  return Number.isSafeInteger(amount) ? amount : null;
}

export function formatMoney(amountMinor: number, hidden = false, currency = DEFAULT_CURRENCY) {
  if (hidden) return "••••";
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amountMinor / 100);
}

export function transactionImpactMinor(transaction: FinanceTransaction) {
  if (transaction.direction === "income") return transaction.amountMinor;
  if (transaction.direction === "expense") return -transaction.amountMinor;
  return transaction.transferEffect === "in" ? transaction.amountMinor : -transaction.amountMinor;
}

export function calculateAccountBalance(account: FinanceAccount, transactions: FinanceTransaction[]) {
  return account.startingBalanceMinor + transactions
    .filter((transaction) => transaction.accountId === account.id)
    .reduce((total, transaction) => total + transactionImpactMinor(transaction), 0);
}

export function calculateClearedBalance(account: FinanceAccount, transactions: FinanceTransaction[]) {
  return account.startingBalanceMinor + transactions
    .filter((transaction) => transaction.accountId === account.id && transaction.status === "cleared")
    .reduce((total, transaction) => total + transactionImpactMinor(transaction), 0);
}

export function calculateRunningBalances(account: FinanceAccount, transactions: FinanceTransaction[]) {
  const balances = new Map<string, number>();
  let balance = account.startingBalanceMinor;
  [...transactions]
    .filter((transaction) => transaction.accountId === account.id)
    .sort((left, right) => left.date.localeCompare(right.date) || left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id))
    .forEach((transaction) => {
      balance += transactionImpactMinor(transaction);
      balances.set(transaction.id, balance);
    });
  return balances;
}

export function getMonthTotals(transactions: FinanceTransaction[], month = new Date()) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  return transactions
    .filter((transaction) => {
      const date = new Date(`${transaction.date}T12:00:00`);
      return date.getFullYear() === year && date.getMonth() === monthIndex;
    })
    .reduce((totals, transaction) => {
      const impact = transactionImpactMinor(transaction);
      if (transaction.direction === "income") totals.incomeMinor += transaction.amountMinor;
      if (transaction.direction === "expense") totals.expenseMinor += transaction.amountMinor;
      totals.netMinor += impact;
      return totals;
    }, { incomeMinor: 0, expenseMinor: 0, netMinor: 0 });
}

export function getCategoryTotals(transactions: FinanceTransaction[], month = new Date()) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const totals = new Map<string, number>();
  transactions.forEach((transaction) => {
    const date = new Date(`${transaction.date}T12:00:00`);
    if (transaction.direction !== "expense" || date.getFullYear() !== year || date.getMonth() !== monthIndex) return;
    totals.set(transaction.categoryId, (totals.get(transaction.categoryId) ?? 0) + transaction.amountMinor);
  });
  return totals;
}

export function advanceRecurringDate(date: string, cadence: FinanceRecurringCadence) {
  const next = new Date(`${date}T12:00:00`);
  if (cadence === "weekly") next.setDate(next.getDate() + 7);
  if (cadence === "biweekly") next.setDate(next.getDate() + 14);
  if (cadence === "monthly") next.setMonth(next.getMonth() + 1);
  if (cadence === "yearly") next.setFullYear(next.getFullYear() + 1);
  return next.toISOString().slice(0, 10);
}

export function getUpcomingRecurringItems(items: FinanceRecurringItem[], from = new Date(), days = 30) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const end = start + days * 24 * 60 * 60 * 1000;
  return items.filter((item) => {
    const time = new Date(`${item.nextExpectedDate}T12:00:00`).getTime();
    return item.active && Number.isFinite(time) && time >= start && time <= end;
  }).sort((left, right) => left.nextExpectedDate.localeCompare(right.nextExpectedDate));
}

export function calculateExpectedCashFlow(items: FinanceRecurringItem[], from = new Date(), days = 30) {
  return getUpcomingRecurringItems(items, from, days).reduce((total, item) => total + (item.direction === "income" || (item.direction === "transfer" && item.transferEffect === "in") ? item.amountMinor : -item.amountMinor), 0);
}

export function calculateBudgetStatus(budget: FinanceBudget, spentMinor: number) {
  const ratio = budget.monthlyLimitMinor > 0 ? spentMinor / budget.monthlyLimitMinor : 0;
  return { remainingMinor: budget.monthlyLimitMinor - spentMinor, percent: ratio * 100, status: ratio >= 1 ? "Over budget" as const : ratio >= 0.85 ? "Near limit" as const : "On track" as const };
}

export function getMerchantTotals(transactions: FinanceTransaction[], month = new Date()) {
  const totals = new Map<string, number>();
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  transactions.forEach((transaction) => {
    const date = new Date(`${transaction.date}T12:00:00`);
    if (transaction.direction !== "expense" || date.getFullYear() !== year || date.getMonth() !== monthIndex) return;
    const merchant = transaction.merchant?.trim() || transaction.description;
    totals.set(merchant, (totals.get(merchant) ?? 0) + transaction.amountMinor);
  });
  return totals;
}

export function getMonthComparison(transactions: FinanceTransaction[], month = new Date()) {
  const previous = new Date(month.getFullYear(), month.getMonth() - 1, 1);
  const current = getMonthTotals(transactions, month);
  const prior = getMonthTotals(transactions, previous);
  return { current, prior, hasComparison: current.expenseMinor > 0 && prior.expenseMinor > 0 };
}

export function getAverageDailySpending(transactions: FinanceTransaction[], month = new Date()) {
  const totals = getMonthTotals(transactions, month);
  const days = new Set(transactions.filter((transaction) => transaction.direction === "expense").filter((transaction) => {
    const date = new Date(`${transaction.date}T12:00:00`);
    return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
  }).map((transaction) => transaction.date));
  return days.size >= 2 ? Math.round(totals.expenseMinor / days.size) : null;
}

export type FinanceAttention = { id: string; tone: "critical" | "attention" | "info"; title: string; detail: string };

export function getNetWorthSummary(accounts: FinanceAccount[], balances: Map<string, number>) {
  const assetsMinor = accounts.filter((account) => account.type !== "credit").reduce((sum, account) => sum + (balances.get(account.id) ?? 0), 0);
  const liabilitiesMinor = accounts.filter((account) => account.type === "credit").reduce((sum, account) => sum + Math.abs(balances.get(account.id) ?? 0), 0);
  return { assetsMinor, liabilitiesMinor, netWorthMinor: assetsMinor - liabilitiesMinor };
}

export function getFinanceAttention(snapshot: FinanceSnapshot, balances: Map<string, number>, now = new Date()): FinanceAttention[] {
  const result: FinanceAttention[] = [];
  snapshot.accounts.filter((account) => !account.archived && account.type !== "credit").forEach((account) => {
    if ((balances.get(account.id) ?? 0) < 0) result.push({ id: `negative:${account.id}`, tone: "critical", title: `${account.name} is below zero`, detail: "Review pending items or move money before the next payment." });
  });
  const categoryTotals = getCategoryTotals(snapshot.transactions, now);
  snapshot.budgets.filter((budget) => budget.active).forEach((budget) => {
    const status = calculateBudgetStatus(budget, categoryTotals.get(budget.categoryId) ?? 0);
    const category = snapshot.categories.find((item) => item.id === budget.categoryId)?.name ?? "Category";
    if (status.status === "Over budget") result.push({ id: `budget-over:${budget.id}`, tone: "critical", title: `${category} is over budget`, detail: `${formatMoney(Math.abs(status.remainingMinor))} over this month's limit.` });
    else if (status.status === "Near limit") result.push({ id: `budget-near:${budget.id}`, tone: "attention", title: `${category} is near its limit`, detail: `${formatMoney(status.remainingMinor)} remaining this month.` });
  });
  const upcoming = getUpcomingRecurringItems(snapshot.recurringItems, now, 7);
  if (upcoming.length) result.push({ id: "recurring:week", tone: "attention", title: `${upcoming.length} expected item${upcoming.length === 1 ? "" : "s"} due this week`, detail: `${formatMoney(Math.abs(calculateExpectedCashFlow(upcoming, now, 7)))} net expected cash flow.` });
  const uncategorized = snapshot.transactions.filter((transaction) => !transaction.categoryId || !snapshot.categories.some((category) => category.id === transaction.categoryId)).length;
  if (uncategorized) result.push({ id: "transactions:uncategorized", tone: "info", title: `${uncategorized} transaction${uncategorized === 1 ? "" : "s"} need categorizing`, detail: "Categorization improves budgets and spending summaries." });
  return result.slice(0, 6);
}

export function getCategoryTotalsForRange(transactions: FinanceTransaction[], from: Date, to: Date) {
  const totals = new Map<string, number>();
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59).getTime();
  transactions.forEach((transaction) => {
    if (transaction.direction !== "expense") return;
    const time = new Date(`${transaction.date}T12:00:00`).getTime();
    if (time >= start && time <= end) totals.set(transaction.categoryId, (totals.get(transaction.categoryId) ?? 0) + transaction.amountMinor);
  });
  return totals;
}
