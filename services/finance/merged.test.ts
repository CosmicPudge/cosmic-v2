import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFinanceCategories } from "./localRepository";
import { getUnifiedMonthTotals, mergeFinanceTransactions } from "./merged";
import { sanitizedProviderTransactions } from "./fixtures/providerTransactions";

test("normalized provider fixture data contributes to the unified Finance model", () => {
  const transactions = mergeFinanceTransactions([], sanitizedProviderTransactions, defaultFinanceCategories);
  const totals = getUnifiedMonthTotals(transactions, new Date("2026-08-15T12:00:00Z"));
  assert.equal(totals.incomeMinor, 250000);
  assert.equal(totals.expenseMinor, 550);
  assert.equal(totals.netMinor, 249450);
});
