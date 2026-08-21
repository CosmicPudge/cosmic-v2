"use client";

import { useCallback, useEffect, useState } from "react";
import type { FinanceAccount, FinanceBudget, FinanceCategory, FinanceRecurringItem, FinanceSnapshot, FinanceTransaction } from "@/core/contracts/Finance";

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

export function validateFinanceSnapshot(value: unknown): FinanceSnapshot | null {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.accounts) || !Array.isArray(value.categories) || !Array.isArray(value.transactions) || typeof value.hideBalances !== "boolean") return null;
  const accounts = value.accounts.filter(isAccount);
  const categories = value.categories.filter(isCategory);
  const accountIds = new Set(accounts.map((account) => account.id));
  const categoryIds = new Set(categories.map((category) => category.id));
  const transactions = value.transactions.filter((transaction): transaction is FinanceTransaction => isTransaction(transaction) && accountIds.has(transaction.accountId) && categoryIds.has(transaction.categoryId));
  const recurringItems = Array.isArray(value.recurringItems) ? value.recurringItems.filter((item): item is FinanceRecurringItem => isRecurringItem(item) && accountIds.has(item.accountId) && categoryIds.has(item.categoryId)) : [];
  const budgets = Array.isArray(value.budgets) ? value.budgets.filter((budget): budget is FinanceBudget => isBudget(budget) && categoryIds.has(budget.categoryId)) : [];
  return { version: 1, accounts, categories: categories.length ? categories : defaultFinanceCategories, transactions, recurringItems, budgets, hideBalances: value.hideBalances, ...(isString(value.selectedAccountId) ? { selectedAccountId: value.selectedAccountId } : {}) };
}

export function readFinanceSnapshot(): FinanceSnapshot {
  try { return validateFinanceSnapshot(JSON.parse(window.localStorage.getItem(FINANCE_STORAGE_KEY) ?? "null")) ?? emptyFinanceData; } catch { return emptyFinanceData; }
}

export function replaceFinanceSnapshot(data: FinanceSnapshot) {
  const validated = validateFinanceSnapshot(data);
  if (!validated) throw new Error("Invalid Finance data.");
  window.localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(validated));
  window.dispatchEvent(new CustomEvent(FINANCE_UPDATE_EVENT, { detail: validated }));
}

function same(left: FinanceSnapshot, right: FinanceSnapshot) { return JSON.stringify(left) === JSON.stringify(right); }
function upsert<T extends { id: string }>(items: T[], item: T) { return items.some((entry) => entry.id === item.id) ? items.map((entry) => entry.id === item.id ? item : entry) : [...items, item]; }

export function useFinanceRepository() {
  const [data, setData] = useState<FinanceSnapshot>(emptyFinanceData);
  const [ready, setReady] = useState(false);

  useEffect(() => { const timer = window.setTimeout(() => { setData(readFinanceSnapshot()); setReady(true); }, 0); return () => window.clearTimeout(timer); }, []);
  useEffect(() => { if (ready) replaceFinanceSnapshot(data); }, [data, ready]);
  useEffect(() => {
    const sync = (event: Event) => { const next = event instanceof CustomEvent && event.detail ? validateFinanceSnapshot(event.detail) : readFinanceSnapshot(); if (next) setData((current) => same(current, next) ? current : next); };
    const storage = (event: StorageEvent) => { if (event.key === FINANCE_STORAGE_KEY) sync(event); };
    window.addEventListener("storage", storage); window.addEventListener(FINANCE_UPDATE_EVENT, sync);
    return () => { window.removeEventListener("storage", storage); window.removeEventListener(FINANCE_UPDATE_EVENT, sync); };
  }, []);

  const saveAccount = useCallback((account: FinanceAccount) => setData((current) => ({ ...current, accounts: upsert(current.accounts, account), selectedAccountId: current.selectedAccountId ?? account.id })), []);
  const saveTransaction = useCallback((transaction: FinanceTransaction) => setData((current) => ({ ...current, transactions: upsert(current.transactions, transaction) })), []);
  const saveRecurringItem = useCallback((item: FinanceRecurringItem) => setData((current) => ({ ...current, recurringItems: upsert(current.recurringItems, item) })), []);
  const removeRecurringItem = useCallback((id: string) => setData((current) => ({ ...current, recurringItems: current.recurringItems.filter((item) => item.id !== id) })), []);
  const saveBudget = useCallback((budget: FinanceBudget) => setData((current) => ({ ...current, budgets: upsert(current.budgets, budget) })), []);
  const removeBudget = useCallback((id: string) => setData((current) => ({ ...current, budgets: current.budgets.filter((budget) => budget.id !== id) })), []);
  const saveCategory = useCallback((category: FinanceCategory) => setData((current) => ({ ...current, categories: upsert(current.categories, category) })), []);
  const removeTransaction = useCallback((id: string) => setData((current) => ({ ...current, transactions: current.transactions.filter((transaction) => transaction.id !== id) })), []);
  const setSelectedAccount = useCallback((id?: string) => setData((current) => ({ ...current, selectedAccountId: id })), []);
  const setHideBalances = useCallback((hideBalances: boolean) => setData((current) => ({ ...current, hideBalances })), []);

  return { data, ready, saveAccount, saveTransaction, removeTransaction, saveRecurringItem, removeRecurringItem, saveBudget, removeBudget, saveCategory, setSelectedAccount, setHideBalances };
}
