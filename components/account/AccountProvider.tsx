"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CosmicAccount } from "@/core/contracts/Account";
import { setActiveCosmicScope } from "@/services/storage/scope";

interface AccountState { loading: boolean; account: CosmicAccount | null; expiresAt: string | null; sessionType: "user" | "device" | null; authenticated: boolean; isAdmin: boolean; refresh(): Promise<void>; signOut(): Promise<void>; }
const AccountContext = createContext<AccountState | null>(null);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<CosmicAccount | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<"user" | "device" | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const syncSession = useCallback(async (showLoading: boolean) => {
    if (showLoading) setLoading(true);
    try {
      const bootQuery = window.location.pathname === "/os/kiosk" ? `?cosmic-kiosk=1&cosmic-boot=${encodeURIComponent(new URLSearchParams(window.location.search).get("cosmic-boot") ?? "")}` : "";
      const response = await fetch(`/api/account/session${bootQuery}`, { cache: "no-store" });
      const payload = await response.json() as { authenticated?: boolean; account?: CosmicAccount; expiresAt?: string; sessionType?: "user" | "device"; isAdmin?: boolean };
      const nextAccount = payload.authenticated && payload.account ? payload.account : null;
      setAccount(nextAccount);
      setExpiresAt(nextAccount ? payload.expiresAt ?? null : null);
      setSessionType(nextAccount ? payload.sessionType ?? "user" : null);
      setIsAdmin(Boolean(nextAccount && payload.isAdmin));
      setActiveCosmicScope(nextAccount ? { id: `account-${nextAccount.id}`, kind: "account" } : "local");
      if (!nextAccount) window.dispatchEvent(new CustomEvent("cosmic:auth-lost"));
    } catch {
      setAccount(null); setExpiresAt(null); setSessionType(null); setIsAdmin(false); setActiveCosmicScope("local"); window.dispatchEvent(new CustomEvent("cosmic:auth-lost"));
    } finally { if (showLoading) setLoading(false); }
  }, []);

  const refresh = useCallback(async () => {
    setAccount(null); setExpiresAt(null); setSessionType(null); setIsAdmin(false); setActiveCosmicScope("local");
    await syncSession(true);
  }, [syncSession]);

  const signOut = useCallback(async () => {
    setLoading(true); setAccount(null); setExpiresAt(null); setSessionType(null); setIsAdmin(false); setActiveCosmicScope("local");
    try { await fetch("/api/account/signout", { method: "POST" }); } finally { setLoading(false); }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(timer); }, [refresh]);
  useEffect(() => {
    const timer = window.setInterval(() => void syncSession(false), 60_000);
    const onVisibility = () => { if (!document.hidden) void syncSession(false); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisibility); };
  }, [syncSession]);

  const value = useMemo(() => ({ loading, account, expiresAt, sessionType, isAdmin, authenticated: Boolean(account), refresh, signOut }), [account, expiresAt, isAdmin, loading, refresh, sessionType, signOut]);
  return <AccountContext.Provider key={account?.id ?? "signed-out"} value={value}>{children}</AccountContext.Provider>;
}

export function useCosmicAccount() { const value = useContext(AccountContext); if (!value) throw new Error("useCosmicAccount must be used inside AccountProvider."); return value; }
