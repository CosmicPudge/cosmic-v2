"use client";

import { useEffect, useState } from "react";
import { useCosmicAccount } from "@/components/account/AccountProvider";
import { useCosmicScope } from "@/services/storage/scope";
import { readSyncMetadata } from "@/services/sync/client";
import type { CosmicSyncDomain, SyncDiagnostic } from "@/services/sync/contracts";

const domains: CosmicSyncDomain[] = ["settings", "notes", "projects", "finance", "garage", "school"];
export default function SyncInspector() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const account = useCosmicAccount(); const scope = useCosmicScope(); const [, setRevision] = useState(0);
  useEffect(() => { const update = () => setRevision((value) => value + 1); window.addEventListener("cosmic:sync-updated", update); return () => window.removeEventListener("cosmic:sync-updated", update); }, []);
  if (!mounted) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-white">
          Cosmic Sync Inspector
        </h1>

        <p className="mt-4 text-sm text-white/50">
          Reading sync state…
        </p>
      </main>
    );
  }
  const currentScope = { id: scope.id, kind: scope.kind }; const diagnostics: SyncDiagnostic[] = domains.map((domain) => { const metadata = readSyncMetadata(currentScope, domain); return { ...metadata, scopeId: scope.id, pending: metadata.status === "syncing" }; });
  return <main className="mx-auto max-w-3xl p-6"><p className="text-xs uppercase tracking-[0.2em] text-cyan-100/50">Developer tools</p><h1 className="mt-2 text-3xl font-bold">Sync inspector</h1><div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm"><p>Account: <code>{account.account?.id ?? "guest"}</code></p><p className="mt-2">Scope: <code>{scope.id}</code> ({scope.kind})</p><p className="mt-2">Cloud sync: {account.authenticated ? "available when DATABASE_URL is configured" : "disabled for guest mode"}</p></div><div className="mt-5 grid gap-3">{diagnostics.map((item) => <article key={item.domain} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><div className="flex items-center justify-between"><h2 className="font-semibold capitalize">{item.domain}</h2><span className="rounded-full border border-white/15 px-2.5 py-1 text-xs">{item.status}</span></div><dl className="mt-3 grid gap-2 text-sm text-white/55 sm:grid-cols-3"><div><dt>Revision</dt><dd className="text-white/85">{item.revision}</dd></div><div><dt>Last synced</dt><dd className="text-white/85">{item.lastSyncedAt ?? "never"}</dd></div><div><dt>Pending</dt><dd className="text-white/85">{item.pending ? "yes" : "no"}</dd></div></dl>{item.error ? <p className="mt-3 text-sm text-amber-200/80">{item.error}</p> : null}</article>)}</div></main>;
}
