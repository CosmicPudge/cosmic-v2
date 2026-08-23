"use client";

import { useCallback, useEffect, useState } from "react";
import { useCosmicAccount } from "@/components/account/AccountProvider";

export interface BillingStatus {
  configured: boolean;
  customerExists: boolean;
  plan: "free" | "cosmic_plus";
  subscription: { status: string; currentPeriodStart: string | null; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean } | null;
}

const unavailable: BillingStatus = { configured: false, customerExists: false, plan: "free", subscription: null };

export function useBillingStatus() {
  const { account, loading: accountLoading } = useCosmicAccount();
  const [data, setData] = useState<BillingStatus>(unavailable);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    if (accountLoading) return;
    if (!account) { setData(unavailable); setLoading(false); return; }
    setLoading(true);
    try {
      const response = await fetch("/api/billing/status", { cache: "no-store" });
      if (!response.ok) throw new Error("Billing status unavailable.");
      setData(await response.json() as BillingStatus);
    } catch {
      setData(unavailable);
    } finally { setLoading(false); }
  }, [account, accountLoading]);
  useEffect(() => { const timer = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(timer); }, [refresh]);
  useEffect(() => { const update = () => void refresh(); window.addEventListener("cosmic:billing-updated", update); return () => window.removeEventListener("cosmic:billing-updated", update); }, [refresh]);
  return { data, loading: accountLoading || loading, refresh };
}
