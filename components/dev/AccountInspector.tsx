"use client";

import { useEffect, useState } from "react";
import { useCosmicAccount } from "@/components/account/AccountProvider";
import { useCosmicScope } from "@/services/storage/scope";

export default function AccountInspector() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const account = useCosmicAccount(); const scope = useCosmicScope();
  const [diagnostics, setDiagnostics] = useState<{ repositoryMode?: string; database?: { configured: boolean; connected: boolean }; sessionId?: string; createdAt?: string; lastUsedAt?: string; userAgent?: string }>();
  useEffect(() => { void fetch("/api/account/session", { cache: "no-store" }).then((response) => response.json()).then(setDiagnostics).catch(() => setDiagnostics(undefined)); }, [account.authenticated, account.expiresAt]);
  if (!mounted) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold">
          Cosmic Account Inspector
        </h1>

        <p className="mt-5 text-sm text-white/50">
          Reading account state…
        </p>
      </main>
    );
  }
  return <main className="mx-auto max-w-2xl p-6"><h1 className="text-3xl font-bold">Account inspector</h1><div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm"><p>Status: <strong>{account.loading ? "loading" : account.authenticated ? "authenticated" : "guest"}</strong></p><p>Repository: <strong>{diagnostics?.repositoryMode ?? "unknown"}</strong></p><p>Database: <strong>{diagnostics?.database ? diagnostics.database.connected ? "connected" : diagnostics.database.configured ? "unavailable" : "not configured" : "unknown"}</strong></p><p>Account: <code>{account.account?.id ?? "none"}</code></p><p>Active scope: <code>{scope.id}</code> ({scope.kind})</p><p>Session ID: <code>{diagnostics?.sessionId ? `${diagnostics.sessionId.slice(0, 12)}…` : "none"}</code></p><p>Created: {diagnostics?.createdAt ?? "none"}</p><p>Last used: {diagnostics?.lastUsedAt ?? "none"}</p><p>Session expiry: {account.expiresAt ?? "none"}</p><p className="break-words text-white/40">User agent: {diagnostics?.userAgent ?? "none"}</p></div></main>;
}
