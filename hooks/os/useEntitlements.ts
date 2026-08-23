"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { CosmicEntitlements } from "@/core/contracts/Entitlements";
import { freeEntitlements } from "@/core/contracts/Entitlements";
import { useCosmicAccount } from "@/components/account/AccountProvider";

type EntitlementState = ReturnType<typeof useEntitlementsInternal>;
const EntitlementsContext = createContext<EntitlementState | null>(null);

function useEntitlementsInternal() {
  const { account, loading: accountLoading } = useCosmicAccount();
  const [data, setData] = useState<CosmicEntitlements>(freeEntitlements);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    if (accountLoading) return;
    if (!account) { setData(freeEntitlements); setLoading(false); return; }
    setLoading(true);
    try {
      const response = await fetch("/api/account/entitlements", { cache: "no-store" });
      if (!response.ok) throw new Error("Entitlements unavailable.");
      setData(await response.json() as CosmicEntitlements);
    } catch {
      setData({ ...freeEntitlements, source: "account" });
    } finally { setLoading(false); }
  }, [account, accountLoading]);
  useEffect(() => { const timer = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(timer); }, [refresh]);
  useEffect(() => { const update = () => void refresh(); window.addEventListener("cosmic:entitlements-updated", update); return () => window.removeEventListener("cosmic:entitlements-updated", update); }, [refresh]);
  return { data, loading: accountLoading || loading, refresh };
}

export function EntitlementsProvider({ children }: { children: ReactNode }) {
  const value = useEntitlementsInternal();
  return createElement(EntitlementsContext.Provider, { value }, children);
}

export function useEntitlements() {
  const value = useContext(EntitlementsContext);
  if (!value) throw new Error("useEntitlements must be used inside EntitlementsProvider.");
  return value;
}
