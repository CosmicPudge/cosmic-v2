"use client";

import Link from "next/link";
import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";
import { WidgetEmpty, WidgetLoading } from "@/components/os/ui/widget";
import { useMemo } from "react";
import { calculateAccountBalance, formatMoney, getUpcomingRecurringItems } from "@/services/finance/domain";
import { getUnifiedAccountTotals, getUnifiedMonthTotals, mergeFinanceAccounts, mergeFinanceTransactions } from "@/services/finance/merged";
import { useFinanceRepository } from "@/services/finance/localRepository";
import { useDashboardWidgetReadiness } from "@/components/dashboard/readiness/DashboardReadiness";
import { useConnectedFinanceData } from "@/components/apps/finance/useConnectedFinanceData";
import { useWidgetContext } from "@/components/os/ui/widget/WidgetContext";
import KioskSceneFrame from "@/components/os/widgets/shared/KioskSceneFrame";

export default function FinanceWidget() {
  const { size, presentation } = useWidgetContext();
  const { data, ready } = useFinanceRepository();
  const { accounts: connectedAccounts, transactions: connectedTransactions, loading: connectedLoading } = useConnectedFinanceData(25);
  const balances = useMemo(() => new Map(data.accounts.map((account) => [account.id, calculateAccountBalance(account, data.transactions)])), [data.accounts, data.transactions]);
  const unifiedAccounts = useMemo(() => mergeFinanceAccounts(data.accounts, connectedAccounts, balances), [data.accounts, connectedAccounts, balances]);
  const totals = getUnifiedAccountTotals(unifiedAccounts);
  const unifiedTransactions = useMemo(() => mergeFinanceTransactions(data.transactions, connectedTransactions, data.categories), [data.transactions, connectedTransactions, data.categories]);
  const account = data.accounts.find((item) => item.id === data.selectedAccountId && !item.archived) ?? data.accounts.find((item) => !item.archived);
  const balance = account ? calculateAccountBalance(account, data.transactions) : 0;
  const month = getUnifiedMonthTotals(unifiedTransactions);
  const next = getUpcomingRecurringItems(data.recurringItems, new Date(), 30)[0];
  useDashboardWidgetReadiness("finance", ready && !connectedLoading ? "ready" : "loading");
  if (presentation === "kiosk") return <KioskSceneFrame scene="finance" eyebrow="COSMIC • FINANCE" title={!ready || connectedLoading ? "Checking accounts." : !unifiedAccounts.length ? "No accounts connected." : formatMoney(totals.availableCashMinor, data.hideBalances)} subtitle={!ready || connectedLoading ? "Financial data is loading" : unifiedAccounts.length ? "Available cash" : "Connect an account to begin"}><div className="kiosk-native-scene-details">{unifiedAccounts.length > 0 && <span>{formatMoney(month.expenseMinor, data.hideBalances)} spent this month</span>}{next && <span>Next expected · {next.name}</span>}</div></KioskSceneFrame>;
  return <Widget accent="finance"><WidgetHeader title="Finance" subtitle={size === "small" ? "Available cash" : "Manual + connected"}/><WidgetBody>{!ready || connectedLoading ? <WidgetLoading label="Loading finance" compact/> : !account && !unifiedAccounts.length ? <WidgetEmpty title="No account yet" description="Connect an institution or add a local account in Finance." compact/> : <div className="space-y-3"><div className="rounded-xl border border-violet-200/15 bg-black/15 p-3"><p className="text-xs uppercase tracking-[.18em] text-violet-100/55">Available cash</p><p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-white">{formatMoney(totals.availableCashMinor, data.hideBalances)}</p>{size !== "small" && <p className="mt-1 text-xs text-white/42">Net worth {formatMoney(totals.netWorthMinor, data.hideBalances)}</p>}</div>{size !== "small" && account ? <div className="flex items-center justify-between gap-2 rounded-xl border border-cyan-200/12 bg-cyan-200/[.04] p-3"><span className="truncate text-xs text-cyan-100/55">{account.name}</span><span className="font-mono text-sm tabular-nums text-white/85">{formatMoney(balance, data.hideBalances)}</span></div> : null}{size !== "small" && <div className="flex items-center justify-between text-sm text-white/65"><span>Net this month</span><span className="font-mono tabular-nums text-cyan-200">{formatMoney(month.expenseMinor, data.hideBalances)} spent</span></div>}{size === "large" && next ? <div className="rounded-xl border border-cyan-200/15 bg-cyan-200/[0.05] p-3 text-sm"><p className="text-xs uppercase tracking-[.18em] text-cyan-100/50">Next expected</p><p className="mt-1 text-white/78">{next.name} · {formatMoney(next.amountMinor, data.hideBalances)}</p></div> : null}</div>}</WidgetBody><WidgetFooter><Link href="/finance" className="text-xs text-cyan-100 hover:text-white">Open Finance</Link></WidgetFooter></Widget>;
}
