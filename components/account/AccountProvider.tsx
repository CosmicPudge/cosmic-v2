"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { CosmicAccount } from "@/core/contracts/Account";
import { PERSONAL_COSMIC_SCOPE, setActiveCosmicScope } from "@/services/storage/scope";

interface AccountState { loading: boolean; account: CosmicAccount | null; expiresAt: string | null; sessionType: "user" | "device" | null; deviceId: string | null; authenticated: boolean; isAdmin: boolean; sessionUnavailable: boolean; refresh(): Promise<void>; signOut(): Promise<void>; }
const AccountContext = createContext<AccountState | null>(null);

function usesAccountRuntime(pathname: string) {
  return pathname === "/account" || pathname.startsWith("/account/")
    || pathname === "/activate" || pathname.startsWith("/activate/")
    || pathname === "/admin" || pathname.startsWith("/admin/")
    || pathname === "/cosmic-plus" || pathname.startsWith("/cosmic-plus/")
    || pathname === "/os/kiosk" || pathname.startsWith("/dev/")
    || pathname.startsWith("/support/");
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const accountRuntime = usesAccountRuntime(pathname);
  const [loading, setLoading] = useState(() => accountRuntime);
  const [account, setAccount] = useState<CosmicAccount | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<"user" | "device" | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sessionUnavailable, setSessionUnavailable] = useState(false);

  const syncSession = useCallback(async (showLoading: boolean) => {
    if (showLoading) setLoading(true);
    setSessionUnavailable(false);
    try {
      const bootQuery = window.location.pathname === "/os/kiosk" ? `?cosmic-kiosk=1&cosmic-boot=${encodeURIComponent(new URLSearchParams(window.location.search).get("cosmic-boot") ?? "")}` : "";
      const response = await fetch(`/api/account/session${bootQuery}`, { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error(`Session validation failed with status ${response.status}.`);
      const payload = await response.json() as { authenticated?: boolean; account?: CosmicAccount; expiresAt?: string; sessionType?: "user" | "device"; deviceId?: string; isAdmin?: boolean };
      const nextAccount = payload.authenticated && payload.account ? payload.account : null;
      setAccount(nextAccount);
      setExpiresAt(nextAccount ? payload.expiresAt ?? null : null);
      setSessionType(nextAccount ? payload.sessionType ?? "user" : null);
      setDeviceId(nextAccount && payload.sessionType === "device" ? payload.deviceId ?? null : null);
      setIsAdmin(Boolean(nextAccount && payload.isAdmin));
      setActiveCosmicScope(nextAccount ? { id: `account-${nextAccount.id}`, kind: "account" } : PERSONAL_COSMIC_SCOPE);
      if (!nextAccount) window.dispatchEvent(new CustomEvent("cosmic:auth-lost"));
    } catch {
      setAccount(null); setExpiresAt(null); setSessionType(null); setDeviceId(null); setIsAdmin(false); setActiveCosmicScope(PERSONAL_COSMIC_SCOPE);
      setSessionUnavailable(true);
    } finally { if (showLoading) setLoading(false); }
  }, []);

  const refresh = useCallback(async () => {
    setAccount(null); setExpiresAt(null); setSessionType(null); setDeviceId(null); setIsAdmin(false); setActiveCosmicScope(PERSONAL_COSMIC_SCOPE);
    setSessionUnavailable(false);
    await syncSession(true);
  }, [syncSession]);

  const signOut = useCallback(async () => {
    setLoading(true); setAccount(null); setExpiresAt(null); setSessionType(null); setDeviceId(null); setIsAdmin(false); setActiveCosmicScope(PERSONAL_COSMIC_SCOPE);
    try { await fetch("/api/account/signout", { method: "POST" }); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!accountRuntime) {
      void Promise.resolve().then(() => {
        setAccount(null); setExpiresAt(null); setSessionType(null); setDeviceId(null); setIsAdmin(false); setSessionUnavailable(false); setActiveCosmicScope(PERSONAL_COSMIC_SCOPE);
        setLoading(false);
      });
      return;
    }
    void Promise.resolve().then(() => refresh());
  }, [accountRuntime, refresh]);
  useEffect(() => {
    if (!accountRuntime) return;
    // Session refresh is lifecycle-driven; this long fallback is only for tabs left open indefinitely.
    const timer = window.setInterval(() => void syncSession(false), 10 * 60_000);
    const onVisibility = () => { if (!document.hidden) void syncSession(false); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisibility); };
  }, [accountRuntime, syncSession]);

  const value = useMemo(() => ({ loading, account, expiresAt, sessionType, deviceId, isAdmin, authenticated: Boolean(account), sessionUnavailable, refresh, signOut }), [account, deviceId, expiresAt, isAdmin, loading, refresh, sessionType, sessionUnavailable, signOut]);
  return <AccountContext.Provider key={account?.id ?? "signed-out"} value={value}>{children}</AccountContext.Provider>;
}

export function useCosmicAccount() { const value = useContext(AccountContext); if (!value) throw new Error("useCosmicAccount must be used inside AccountProvider."); return value; }
export function useOptionalCosmicAccount() { return useContext(AccountContext); }
