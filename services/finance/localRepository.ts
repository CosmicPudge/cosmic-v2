"use client";

import { useCallback, useEffect, useState } from "react";
import type { FinanceAccount, FinanceBudget, FinanceCategory, FinanceRecurringItem, FinanceSnapshot, FinanceTransaction } from "@/core/contracts/Finance";
import { createScopedStorageKey, migrateLegacyStorage, readScopedOrLegacy, useCosmicScope } from "@/services/storage/scope";
import { useCloudSnapshotSync } from "@/services/sync/useCloudSnapshotSync";

export const FINANCE_STORAGE_KEY = "cosmic.finance.local-data";
export const FINANCE_UPDATE_EVENT = "cosmic:finance-local-data-updated";

const categoryNames = ["Housing", "Groceries", "Dining", "Transportation", "Gas", "Auto", "Shopping", "Entertainment", "School", "Subscriptions", "Utilities", "Health", "Travel", "Income", "Transfer", "Other"];
export const defaultFinanceCategories: FinanceCategory[] = categoryNames.map((name) => ({ id: `system-${name.toLowerCase().replaceAll(" ", "-")}`, name, system: true, archived: false, createdAt: "2026-01-01T00:00:00.000Z" }));
export const emptyFinanceData: FinanceSnapshot = { version: 1, accounts: [], categories: defaultFinanceCategories, transactions: [], recurringItems: [], budgets: [], hideBalances: false };

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function isString(value: unknown): value is string { return typeof value === "string"; }
function isFiniteMinor(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value); }
function isAccount(value: unknown): value is FinanceAccount {
  return isRecord(value) && isString(value.id) && isString(value.name) && ["checking", "savings", "cash", "credit", "other"].includes(String(value.type)) && isFiniteMinor(value.startingBalanceMinor) && typeof value.archived === "boolean" && isString(value.createdAt) && isString(value.updatedAt);
}
function isCategory(value: unknown): value is FinanceCategory { return isRecord(value) && isString(value.id) && isString(value.name) && typeof value.system === "boolean" && typeof value.archived === "boolean" && isString(value.createdAt); }
function isTransaction(value: unknown): value is FinanceTransaction {
  if (!isRecord(value)) return false;
  const amountMinor = value.amountMinor;
  return isString(value.id) && isString(value.accountId) && isString(value.date) && isString(value.description) && isFiniteMinor(amountMinor) && amountMinor >= 0 && ["income", "expense", "transfer"].includes(String(value.direction)) && isString(value.categoryId) && ["pending", "cleared"].includes(String(value.status)) && isString(value.createdAt) && isString(value.updatedAt);
}
function isRecurringItem(value: unknown): value is FinanceRecurringItem {
  return isRecord(value) && isString(value.id) && isString(value.accountId) && isString(value.name) && isFiniteMinor(value.amountMinor) && value.amountMinor >= 0 && ["income", "expense", "transfer"].includes(String(value.direction)) && isString(value.categoryId) && ["weekly", "biweekly", "monthly", "yearly"].includes(String(value.cadence)) && isString(value.nextExpectedDate) && typeof value.active === "boolean" && isString(value.createdAt) && isString(value.updatedAt);
}
function isBudget(value: unknown): value is FinanceBudget {
  return isRecord(value) && isString(value.id) && isString(value.categoryId) && isFiniteMinor(value.monthlyLimitMinor) && value.monthlyLimitMinor >= 0 && typeof value.active === "boolean" && isString(value.createdAt) && isString(value.updatedAt);
}

function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => !seen.has(item.id) && seen.add(item.id));
}

export function validateFinanceSnapshot(value: unknown): FinanceSnapshot | null {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.accounts) || !Array.isArray(value.categories) || !Array.isArray(value.transactions) || typeof value.hideBalances !== "boolean") return null;
  const accounts = uniqueById(value.accounts.filter(isAccount));
  const categories = uniqueById(value.categories.filter(isCategory));
  const accountIds = new Set(accounts.map((account) => account.id));
  const categoryIds = new Set(categories.map((category) => category.id));
  const transactions = uniqueById(value.transactions.filter((transaction): transaction is FinanceTransaction => isTransaction(transaction) && accountIds.has(transaction.accountId) && categoryIds.has(transaction.categoryId)));
  const recurringItems = Array.isArray(value.recurringItems) ? uniqueById(value.recurringItems.filter((item): item is FinanceRecurringItem => isRecurringItem(item) && accountIds.has(item.accountId) && categoryIds.has(item.categoryId))) : [];
  const budgets = Array.isArray(value.budgets) ? uniqueById(value.budgets.filter((budget): budget is FinanceBudget => isBudget(budget) && categoryIds.has(budget.categoryId))) : [];
  return { version: 1, accounts, categories: categories.length ? categories : defaultFinanceCategories, transactions, recurringItems, budgets, hideBalances: value.hideBalances, ...(isString(value.selectedAccountId) ? { selectedAccountId: value.selectedAccountId } : {}) };
}

export function readFinanceSnapshot(scopeId?: string): FinanceSnapshot {
  try { const stored = readScopedOrLegacy("finance", scopeId); if (stored.migrated && stored.raw) migrateLegacyStorage("finance", stored.raw, scopeId); return validateFinanceSnapshot(JSON.parse(stored.raw ?? "null")) ?? emptyFinanceData; } catch { return emptyFinanceData; }
}

export function replaceFinanceSnapshot(data: FinanceSnapshot, scopeId?: string) {
  const validated = validateFinanceSnapshot(data);
  if (!validated) throw new Error("Invalid Finance data.");
  window.localStorage.setItem(createScopedStorageKey("finance", scopeId), JSON.stringify(validated));
  window.dispatchEvent(new CustomEvent(FINANCE_UPDATE_EVENT, { detail: validated }));
}

function same(left: FinanceSnapshot, right: FinanceSnapshot) { return JSON.stringify(left) === JSON.stringify(right); }
function upsert<T extends { id: string }>(items: T[], item: T) { return items.some((entry) => entry.id === item.id) ? items.map((entry) => entry.id === item.id ? item : entry) : [...items, item]; }

export function useFinanceRepository() {
  const scope = useCosmicScope();
  const [data, setData] = useState<FinanceSnapshot>(emptyFinanceData);
  const [ready, setReady] = useState(false);
  const [loadedScope, setLoadedScope] = useState<string>();

  useEffect(() => {
    // Never render or persist the previous account's records while a new scope
    // is hydrating. The ready flag is intentionally false for this transition.
    const timer = window.setTimeout(() => { setData(readFinanceSnapshot(scope.id)); setLoadedScope(scope.id); setReady(true); }, 0);
    return () => window.clearTimeout(timer);
  }, [scope.id]);
  useEffect(() => { if (ready && loadedScope === scope.id) replaceFinanceSnapshot(data, scope.id); }, [data, ready, loadedScope, scope.id]);
  useEffect(() => {
    const sync = (event: Event) => { const next = event instanceof CustomEvent && event.detail ? validateFinanceSnapshot(event.detail) : readFinanceSnapshot(scope.id); if (next) setData((current) => same(current, next) ? current : next); };
    const storage = (event: StorageEvent) => { if (event.key === createScopedStorageKey("finance", scope.id) || event.key === FINANCE_STORAGE_KEY) sync(event); };
    window.addEventListener("storage", storage); window.addEventListener(FINANCE_UPDATE_EVENT, sync);
    return () => { window.removeEventListener("storage", storage); window.removeEventListener(FINANCE_UPDATE_EVENT, sync); };
  }, [scope.id]);

  const sync = useCloudSnapshotSync({ domain: "finance", scope, ready: ready && loadedScope === scope.id, data, setData, equals: same });

  const saveAccount = useCallback((account: FinanceAccount) => setData((current) => ({ ...current, accounts: upsert(current.accounts, account), selectedAccountId: current.selectedAccountId ?? account.id })), []);
  const saveTransaction = useCallback((transaction: FinanceTransaction) => setData((current) => ({ ...current, transactions: upsert(current.transactions, transaction) })), []);
  const saveTransactions = useCallback((transactions: FinanceTransaction[]) => setData((current) => ({ ...current, transactions: transactions.reduce((items, transaction) => upsert(items, transaction), current.transactions) })), []);
  const saveRecurringItem = useCallback((item: FinanceRecurringItem) => setData((current) => ({ ...current, recurringItems: upsert(current.recurringItems, item) })), []);
  const removeRecurringItem = useCallback((id: string) => setData((current) => ({ ...current, recurringItems: current.recurringItems.filter((item) => item.id !== id) })), []);
  const saveBudget = useCallback((budget: FinanceBudget) => setData((current) => ({ ...current, budgets: upsert(current.budgets, budget) })), []);
  const removeBudget = useCallback((id: string) => setData((current) => ({ ...current, budgets: current.budgets.filter((budget) => budget.id !== id) })), []);
  const saveCategory = useCallback((category: FinanceCategory) => setData((current) => ({ ...current, categories: upsert(current.categories, category) })), []);
  const removeTransaction = useCallback((id: string) => setData((current) => ({ ...current, transactions: current.transactions.filter((transaction) => transaction.id !== id) })), []);
  const setSelectedAccount = useCallback((id?: string) => setData((current) => ({ ...current, selectedAccountId: id })), []);
  const setHideBalances = useCallback((hideBalances: boolean) => setData((current) => ({ ...current, hideBalances })), []);

  const scopedReady = ready && loadedScope === scope.id;
  return { data: scopedReady ? data : emptyFinanceData, ready: scopedReady, sync, saveAccount, saveTransaction, saveTransactions, removeTransaction, saveRecurringItem, removeRecurringItem, saveBudget, removeBudget, saveCategory, setSelectedAccount, setHideBalances };
}
