"use client";

import { useCallback, useEffect, useState } from "react";
import { useCosmicAccount } from "@/components/account/AccountProvider";

export interface BillingStatus {
  configured: boolean;
  configuration: { checkoutConfigured: boolean; webhookConfigured: boolean; environment: "test" | "live" | "unknown"; modeMismatch: boolean; liveModeBlocked: boolean; priceConfigured: boolean; missing: string[] };
  customerExists: boolean;
  plan: "free" | "cosmic_plus";
  subscription: { status: string; currentPeriodStart: string | null; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean } | null;
}

const unavailable: BillingStatus = { configured: false, configuration: { checkoutConfigured: false, webhookConfigured: false, environment: "unknown", modeMismatch: false, liveModeBlocked: false, priceConfigured: false, missing: [] }, customerExists: false, plan: "free", subscription: null };

export function useBillingStatus() {
  const { account, loading: accountLoading } = useCosmicAccount();
  const [data, setData] = useState<BillingStatus>(unavailable);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    if (accountLoading) return;
    if (!account) { setData(unavailable); setError(null); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/billing/status", { cache: "no-store" });
      if (!response.ok) throw new Error("Billing status unavailable.");
      setData(await response.json() as BillingStatus);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Billing status unavailable.");
    } finally { setLoading(false); }
  }, [account, accountLoading]);
  useEffect(() => { const timer = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(timer); }, [refresh]);
  useEffect(() => { const update = () => void refresh(); window.addEventListener("cosmic:billing-updated", update); return () => window.removeEventListener("cosmic:billing-updated", update); }, [refresh]);
  return { data, loading: accountLoading || loading, error, refresh };
}
