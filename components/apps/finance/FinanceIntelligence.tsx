"use client";

import { useMemo, useState } from "react";
import type { FinanceAccount, FinanceBudget, FinanceCategory, FinanceRecurringCadence, FinanceRecurringItem, FinanceSnapshot, FinanceTransaction, FinanceTransactionDirection } from "@/core/contracts/Finance";
import { advanceRecurringDate, calculateBudgetStatus, calculateExpectedCashFlow, formatMoney, getAverageDailySpending, getCategoryTotals, getMerchantTotals, getMonthComparison, getUpcomingRecurringItems, parseMoneyToMinor, transactionImpactMinor } from "@/services/finance/domain";

const inputClass = "mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-200/45 focus:ring-4 focus:ring-cyan-300/10";
const buttonClass = "inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.07] px-3.5 py-2 text-sm font-medium text-white/78 transition hover:bg-white/[0.13] focus:outline-none focus:ring-4 focus:ring-cyan-300/10";
const id = () => crypto.randomUUID();
const today = () => new Date().toISOString().slice(0, 10);
const dateLabel = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

interface Props {
  data: FinanceSnapshot;
  selectedAccount?: FinanceAccount;
  balances: Map<string, number>;
  saveTransaction: (transaction: FinanceTransaction) => void;
  saveRecurringItem: (item: FinanceRecurringItem) => void;
  removeRecurringItem: (id: string) => void;
  saveBudget: (budget: FinanceBudget) => void;
  removeBudget: (id: string) => void;
  saveCategory: (category: FinanceCategory) => void;
}

type RecurringDraft = { accountId: string; name: string; merchant: string; amount: string; direction: FinanceTransactionDirection; cadence: FinanceRecurringCadence; nextExpectedDate: string; categoryId: string };

function recurringDraft(item: FinanceRecurringItem | undefined, accountId: string, categoryId: string): RecurringDraft {
  return { accountId: item?.accountId ?? accountId, name: item?.name ?? "", merchant: item?.merchant ?? "", amount: item ? (item.amountMinor / 100).toFixed(2) : "", direction: item?.direction ?? "expense", cadence: item?.cadence ?? "monthly", nextExpectedDate: item?.nextExpectedDate ?? today(), categoryId: item?.categoryId ?? categoryId };
}

export default function FinanceIntelligence({ data, selectedAccount, balances, saveTransaction, saveRecurringItem, removeRecurringItem, saveBudget, removeBudget, saveCategory }: Props) {
  const hidden = data.hideBalances;
  const categories = data.categories.filter((category) => !category.archived);
  const categoryName = (categoryId: string) => data.categories.find((category) => category.id === categoryId)?.name ?? "Other";
  const upcoming = useMemo(() => getUpcomingRecurringItems(data.recurringItems, new Date(), 30), [data.recurringItems]);
  const [projectionNow] = useState(() => new Date());
  const categoryTotals = useMemo(() => getCategoryTotals(data.transactions), [data.transactions]);
  const merchantTotals = useMemo(() => getMerchantTotals(data.transactions), [data.transactions]);
  const comparison = useMemo(() => getMonthComparison(data.transactions), [data.transactions]);
  const averageDaily = useMemo(() => getAverageDailySpending(data.transactions), [data.transactions]);
  const largestExpense = useMemo(() => data.transactions.filter((transaction) => transaction.direction === "expense").sort((left, right) => right.amountMinor - left.amountMinor)[0], [data.transactions]);
  const projectedForSelected = selectedAccount ? (balances.get(selectedAccount.id) ?? 0) + getUpcomingRecurringItems(data.recurringItems, projectionNow, 30).filter((item) => item.accountId === selectedAccount.id).reduce((total, item) => total + transactionImpactMinor({ ...item, id: item.id, description: item.name, date: item.nextExpectedDate, status: "pending", createdAt: item.createdAt, updatedAt: item.updatedAt } as FinanceTransaction), 0) : 0;
  const [recurringForm, setRecurringForm] = useState<RecurringDraft | null>(null);
  const [editingRecurringId, setEditingRecurringId] = useState<string>();
  const [budgetCategoryId, setBudgetCategoryId] = useState(categories.find((category) => category.name === "Dining")?.id ?? categories[0]?.id ?? "");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [categoryNameDraft, setCategoryNameDraft] = useState("");
  const [error, setError] = useState<string>();

  const recordRecurring = (item: FinanceRecurringItem) => {
    const duplicate = data.transactions.some((transaction) => transaction.accountId === item.accountId && transaction.date === item.nextExpectedDate && transaction.amountMinor === item.amountMinor && (transaction.merchant || transaction.description) === (item.merchant || item.name));
    if (duplicate) { setError("A matching transaction already exists for this expected date."); return; }
    const now = new Date().toISOString();
    saveTransaction({ id: id(), accountId: item.accountId, date: item.nextExpectedDate, description: item.name, ...(item.merchant ? { merchant: item.merchant } : {}), amountMinor: item.amountMinor, direction: item.direction, ...(item.transferEffect ? { transferEffect: item.transferEffect } : {}), categoryId: item.categoryId, status: "cleared", createdAt: now, updatedAt: now });
    saveRecurringItem({ ...item, nextExpectedDate: advanceRecurringDate(item.nextExpectedDate, item.cadence), updatedAt: now });
    setError(undefined);
  };

  const saveRecurring = () => {
    if (!recurringForm?.name.trim() || !recurringForm.accountId) { setError("Add a name and account for the expected item."); return; }
    const amountMinor = parseMoneyToMinor(recurringForm.amount);
    if (amountMinor === null || amountMinor <= 0) { setError("Enter a valid expected amount."); return; }
    const now = new Date().toISOString();
    const existing = editingRecurringId ? data.recurringItems.find((item) => item.id === editingRecurringId) : undefined;
    saveRecurringItem({ id: existing?.id ?? id(), accountId: recurringForm.accountId, name: recurringForm.name.trim(), ...(recurringForm.merchant.trim() ? { merchant: recurringForm.merchant.trim() } : {}), amountMinor, direction: recurringForm.direction, categoryId: recurringForm.categoryId, cadence: recurringForm.cadence, nextExpectedDate: recurringForm.nextExpectedDate, active: existing?.active ?? true, createdAt: existing?.createdAt ?? now, updatedAt: now });
    setRecurringForm(null); setEditingRecurringId(undefined); setError(undefined);
  };

  const addBudget = () => {
    const amount = parseMoneyToMinor(budgetAmount);
    if (!budgetCategoryId || amount === null || amount <= 0) { setError("Choose a category and enter a monthly budget."); return; }
    const existing = data.budgets.find((budget) => budget.categoryId === budgetCategoryId);
    const now = new Date().toISOString();
    saveBudget({ id: existing?.id ?? id(), categoryId: budgetCategoryId, monthlyLimitMinor: amount, active: true, createdAt: existing?.createdAt ?? now, updatedAt: now });
    setBudgetAmount(""); setError(undefined);
  };

  const addCategory = () => {
    const name = categoryNameDraft.trim();
    if (!name || categories.some((category) => category.name.toLocaleLowerCase() === name.toLocaleLowerCase())) { setError("Enter a new category name."); return; }
    saveCategory({ id: `custom-${id()}`, name, system: false, archived: false, createdAt: new Date().toISOString() });
    setCategoryNameDraft(""); setError(undefined);
  };

  return <div className="space-y-6">
    <section className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]"><div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-white/84">Upcoming · projected</h2><p className="mt-1 text-xs text-white/35">Expected records do not change actual balances.</p></div><button type="button" className={buttonClass} onClick={() => { setEditingRecurringId(undefined); setRecurringForm(recurringDraft(undefined, selectedAccount?.id ?? data.accounts[0]?.id ?? "", categories[0]?.id ?? "")); setError(undefined); }}>Add recurring</button></div>{recurringForm ? <RecurringForm draft={recurringForm} accounts={data.accounts.filter((account) => !account.archived)} categories={categories} error={error} onChange={setRecurringForm} onSave={saveRecurring} onCancel={() => setRecurringForm(null)} /> : null}<div className="mt-4 space-y-2">{upcoming.slice(0, 8).map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-black/10 p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-white/75">{item.name}</p><p className="mt-1 text-xs text-white/38">Expected {dateLabel(item.nextExpectedDate)} · {item.cadence} · {categoryName(item.categoryId)}</p></div><div className="flex items-center gap-3"><span className={item.direction === "income" ? "text-emerald-200/75" : "text-rose-200/70"}>{formatMoney(item.amountMinor, hidden)}</span><button type="button" className="text-xs text-cyan-100/65 hover:text-cyan-100" onClick={() => recordRecurring(item)}>Record transaction</button><button type="button" className="text-xs text-white/42 hover:text-white/75" onClick={() => { setEditingRecurringId(item.id); setRecurringForm(recurringDraft(item, item.accountId, item.categoryId)); }}>Edit</button><button type="button" className="text-xs text-rose-200/50 hover:text-rose-100" onClick={() => window.confirm("Remove this expected item?") && removeRecurringItem(item.id)}>Remove</button></div></div>)}{!upcoming.length ? <p className="text-sm text-white/38">No expected bills or income in the next 30 days.</p> : null}</div></div><div className="rounded-3xl border border-cyan-200/12 bg-cyan-200/[0.035] p-5"><p className="text-xs uppercase tracking-[0.18em] text-cyan-100/45">Projected · next 30 days</p><p className="mt-3 text-sm text-white/48">{selectedAccount ? `${selectedAccount.name} starting from recorded balance` : "Select an account to see a projection"}</p><p className="mt-2 text-3xl font-semibold text-white/85">{selectedAccount ? formatMoney(projectedForSelected, hidden) : "—"}</p><p className="mt-2 text-xs leading-5 text-white/35">Known recurring expectations only. This is not an available balance.</p><p className="mt-4 text-sm text-white/55">Expected cash flow: <span className="font-medium text-white/78">{formatMoney(calculateExpectedCashFlow(data.recurringItems), hidden)}</span></p>{selectedAccount && projectedForSelected < 0 ? <p className="mt-3 text-xs text-amber-100/75">Projected below $0 · expected calculation only</p> : null}</div></section>
    <section className="grid gap-4 xl:grid-cols-[1fr_1fr]"><div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5"><h2 className="font-semibold text-white/82">Budgets · this month</h2><div className="mt-4 grid gap-2 sm:grid-cols-[1fr_160px_auto]"><select aria-label="Budget category" className={inputClass} value={budgetCategoryId} onChange={(event) => setBudgetCategoryId(event.target.value)}>{categories.filter((category) => category.name !== "Income" && category.name !== "Transfer").map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><input aria-label="Monthly budget amount" className={inputClass} inputMode="decimal" placeholder="Monthly limit" value={budgetAmount} onChange={(event) => setBudgetAmount(event.target.value)} /><button type="button" className={buttonClass} onClick={addBudget}>Save</button></div><div className="mt-4 space-y-3">{data.budgets.filter((budget) => budget.active).map((budget) => { const spent = categoryTotals.get(budget.categoryId) ?? 0; const status = calculateBudgetStatus(budget, spent); return <div key={budget.id} className="rounded-2xl border border-white/8 bg-black/10 p-3"><div className="flex justify-between gap-3 text-sm"><span className="text-white/65">{categoryName(budget.categoryId)}</span><span className="text-white/55">{formatMoney(spent, hidden)} of {formatMoney(budget.monthlyLimitMinor, hidden)}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-200/65" style={{ width: `${Math.min(100, status.percent)}%` }} /></div><div className="mt-2 flex justify-between text-xs text-white/38"><span>{status.status}</span><span>{formatMoney(status.remainingMinor, hidden)} remaining</span><button type="button" className="text-rose-200/55" onClick={() => window.confirm("Disable this budget?") && removeBudget(budget.id)}>Disable</button></div></div>; })}{!data.budgets.length ? <p className="text-sm text-white/38">Set a monthly category target to compare it with actual expenses.</p> : null}</div></div><div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5"><h2 className="font-semibold text-white/82">Actual spending signals</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><div><p className="text-xs uppercase tracking-wider text-white/35">Transactions</p><p className="mt-1 text-xl text-white/78">{data.transactions.length}</p></div><div><p className="text-xs uppercase tracking-wider text-white/35">Average daily spend</p><p className="mt-1 text-xl text-white/78">{averageDaily === null ? "Not enough data" : formatMoney(averageDaily, hidden)}</p></div><div><p className="text-xs uppercase tracking-wider text-white/35">Largest expense</p><p className="mt-1 text-xl text-white/78">{largestExpense ? formatMoney(largestExpense.amountMinor, hidden) : "No expenses"}</p></div><div><p className="text-xs uppercase tracking-wider text-white/35">Month comparison</p><p className="mt-1 text-xl text-white/78">{comparison.hasComparison ? formatMoney(comparison.current.expenseMinor - comparison.prior.expenseMinor, hidden) : "Not enough data"}</p></div></div><div className="mt-5 space-y-2">{[...merchantTotals.entries()].sort((left, right) => right[1] - left[1]).slice(0, 4).map(([merchant, amount]) => <div key={merchant} className="flex justify-between text-sm"><span className="text-white/52">{merchant}</span><span className="text-white/72">{formatMoney(amount, hidden)}</span></div>)}</div></div></section>
    <section className="rounded-3xl border border-white/10 bg-white/[0.045] p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="font-semibold text-white/82">Categories</h2><p className="mt-1 text-xs text-white/35">Built-in categories stay stable. Custom categories can be archived without changing history.</p></div><div className="flex gap-2"><input aria-label="New custom category" className={`${inputClass} mt-0`} placeholder="Custom category" value={categoryNameDraft} onChange={(event) => setCategoryNameDraft(event.target.value)} /><button type="button" className={buttonClass} onClick={addCategory}>Add</button></div></div><div className="mt-4 flex flex-wrap gap-2">{data.categories.filter((category) => !category.archived).map((category) => <span key={category.id} className="inline-flex items-center gap-2 rounded-full border border-white/9 bg-white/[0.04] px-3 py-1.5 text-xs text-white/55">{category.name}{!category.system ? <button type="button" aria-label={`Archive ${category.name}`} className="text-white/35 hover:text-white/75" onClick={() => saveCategory({ ...category, archived: true })}>×</button> : null}</span>)}</div>{error ? <p role="alert" className="mt-3 text-sm text-rose-200/80">{error}</p> : null}</section>
  </div>;
}

function RecurringForm({ draft, accounts, categories, error, onChange, onSave, onCancel }: { draft: RecurringDraft; accounts: FinanceAccount[]; categories: FinanceCategory[]; error?: string; onChange: (draft: RecurringDraft) => void; onSave: () => void; onCancel: () => void }) {
  const update = <K extends keyof RecurringDraft>(key: K, value: RecurringDraft[K]) => onChange({ ...draft, [key]: value });
  return <div className="mt-4 rounded-2xl border border-cyan-200/12 bg-cyan-200/[0.035] p-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label className="text-xs text-white/52">Name<input className={inputClass} value={draft.name} onChange={(event) => update("name", event.target.value)} /></label><label className="text-xs text-white/52">Account<select className={inputClass} value={draft.accountId} onChange={(event) => update("accountId", event.target.value)}>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><label className="text-xs text-white/52">Amount<input className={inputClass} inputMode="decimal" value={draft.amount} onChange={(event) => update("amount", event.target.value)} /></label><label className="text-xs text-white/52">Next expected date<input className={inputClass} type="date" value={draft.nextExpectedDate} onChange={(event) => update("nextExpectedDate", event.target.value)} /></label><label className="text-xs text-white/52">Direction<select className={inputClass} value={draft.direction} onChange={(event) => update("direction", event.target.value as FinanceTransactionDirection)}><option value="expense">Expense</option><option value="income">Income</option><option value="transfer">Transfer</option></select></label><label className="text-xs text-white/52">Cadence<select className={inputClass} value={draft.cadence} onChange={(event) => update("cadence", event.target.value as FinanceRecurringCadence)}><option value="weekly">Weekly</option><option value="biweekly">Every 2 weeks</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></label><label className="text-xs text-white/52">Category<select className={inputClass} value={draft.categoryId} onChange={(event) => update("categoryId", event.target.value)}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="text-xs text-white/52">Merchant<input className={inputClass} value={draft.merchant} onChange={(event) => update("merchant", event.target.value)} /></label></div>{error ? <p role="alert" className="mt-3 text-sm text-rose-200/80">{error}</p> : null}<div className="mt-3 flex gap-2"><button type="button" className={buttonClass} onClick={onSave}>Save expected item</button><button type="button" className={buttonClass} onClick={onCancel}>Cancel</button></div></div>;
}
