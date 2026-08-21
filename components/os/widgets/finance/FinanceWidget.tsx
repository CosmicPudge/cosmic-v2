"use client";

import Link from "next/link";
import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";
import { WidgetEmpty, WidgetLoading } from "@/components/os/ui/widget";
import { calculateAccountBalance, formatMoney, getMonthTotals, getUpcomingRecurringItems } from "@/services/finance/domain";
import { useFinanceRepository } from "@/services/finance/localRepository";

export default function FinanceWidget() {
  const { data, ready } = useFinanceRepository();
  const account = data.accounts.find((item) => item.id === data.selectedAccountId && !item.archived) ?? data.accounts.find((item) => !item.archived);
  const balance = account ? calculateAccountBalance(account, data.transactions) : 0;
  const month = getMonthTotals(data.transactions);
  const next = getUpcomingRecurringItems(data.recurringItems, new Date(), 30)[0];
  return <Widget accent="finance"><WidgetHeader title="Finance" subtitle="Manual records"/><WidgetBody>{!ready ? <WidgetLoading label="Loading finance" compact/> : !account ? <WidgetEmpty title="No account yet" description="Add a local account in Finance to begin." compact/> : <div className="space-y-3"><div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs uppercase tracking-wide text-white/40">{account.name}</p><p className="mt-1 text-2xl font-semibold">{formatMoney(balance, data.hideBalances)}</p></div><div className="text-sm text-white/60">This month: {formatMoney(month.expenseMinor, data.hideBalances)} spent</div>{next ? <div className="rounded-xl border border-cyan-200/15 bg-cyan-200/[0.05] p-3 text-sm"><p className="text-xs uppercase tracking-wide text-cyan-100/50">Next expected</p><p className="mt-1 text-white/78">{next.name} · {formatMoney(next.amountMinor, data.hideBalances)}</p></div> : null}</div>}</WidgetBody><WidgetFooter><Link href="/finance" className="text-xs text-cyan-100 hover:text-white">Open Finance</Link></WidgetFooter></Widget>;
}
