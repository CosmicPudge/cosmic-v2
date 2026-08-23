"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import type { CosmicAccount } from "@/core/contracts/Account";
import { setActiveCosmicScope } from "@/services/storage/scope";

interface AccountState {
  loading: boolean;
  account: CosmicAccount | null;
  expiresAt: string | null;
  authenticated: boolean;
  refresh(): Promise<void>;
  signOut(): Promise<void>;
}

const AccountContext = createContext<AccountState | null>(null);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<CosmicAccount | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/account/session", { cache: "no-store" });
      const payload = await response.json() as { authenticated?: boolean; account?: CosmicAccount; expiresAt?: string };
      const nextAccount = payload.authenticated && payload.account ? payload.account : null;
      setAccount(nextAccount);
      setExpiresAt(nextAccount ? payload.expiresAt ?? null : null);
      setActiveCosmicScope(nextAccount ? { id: `account-${nextAccount.id}`, kind: "account" } : "local");
    } catch {
      setAccount(null);
      setExpiresAt(null);
      setActiveCosmicScope("local");
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/account/signout", { method: "POST" });
    setAccount(null);
    setExpiresAt(null);
    setActiveCosmicScope("local");
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(timer); }, [refresh]);

  const value = useMemo(() => ({ loading, account, expiresAt, authenticated: Boolean(account), refresh, signOut }), [account, expiresAt, loading, refresh, signOut]);
  return <AccountContext.Provider key={account?.id ?? "guest"} value={value}>{children}</AccountContext.Provider>;
}

export function useCosmicAccount() {
  const value = useContext(AccountContext);
  if (!value) throw new Error("useCosmicAccount must be used inside AccountProvider.");
  return value;
}
