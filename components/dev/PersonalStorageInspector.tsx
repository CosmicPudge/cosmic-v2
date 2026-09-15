"use client";

import { useSyncExternalStore } from "react";
import {
  inspectPersonalMigration,
  migratePersonalStorage,
  type PersonalMigrationInspection,
} from "@/services/storage/personalMigration";

let clientReport: PersonalMigrationInspection | null = null;
const listeners = new Set<() => void>();
function readClientReport() {
  if (typeof window === "undefined") return null;
  return clientReport ??= inspectPersonalMigration(window.localStorage);
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export default function PersonalStorageInspector() {
  const report = useSyncExternalStore(subscribe, readClientReport, () => null);

  function migrateReadyDomains() {
    migratePersonalStorage(window.localStorage);
    clientReport = inspectPersonalMigration(window.localStorage);
    listeners.forEach((listener) => listener());
  }

  if (!report) {
    return <main className="mx-auto max-w-5xl p-6 text-white/60">Inspecting local metadata…</main>;
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6 text-white">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/50">Developer tools</p>
        <h1 className="mt-2 text-3xl font-semibold">Personal storage inspection</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/55">
          Metadata only: this page does not migrate, overwrite, delete, or print local record contents.
          Migration version {report.version}.
        </p>
        <button type="button" onClick={migrateReadyDomains} className="mt-4 rounded-xl border border-cyan-200/25 bg-cyan-200/10 px-4 py-2 text-sm text-cyan-50">
          Migrate ready domains
        </button>
      </div>
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
        <div className="grid grid-cols-4 gap-3 border-b border-white/10 px-4 py-3 text-xs uppercase tracking-wider text-white/45">
          <span>Domain</span><span>Destination</span><span>Safe source</span><span>Status</span>
        </div>
        {report.domains.map((item) => (
          <div key={item.domain} className="grid grid-cols-4 gap-3 border-b border-white/5 px-4 py-3 text-sm last:border-b-0">
            <span className="capitalize">{item.domain.replaceAll("-", " ")}</span>
            <span>{item.destinationPresent ? `${item.destinationBytes} bytes` : "absent"}</span>
            <span>{item.safeSource ? `${item.safeSource} · ${item.safeSourceBytes} bytes` : "none"}</span>
            <span className={item.status === "conflict" || item.status === "ambiguous" || item.status === "account-source-only" || item.status === "invalid-source" ? "text-amber-200" : "text-white/70"}>{item.status}</span>
            <details className="col-span-4 text-xs text-white/45"><summary className="cursor-pointer">Candidate metadata</summary><div className="mt-2 space-y-1">{item.candidates.map((candidate) => <p key={candidate.key}><code>{candidate.key}</code> · {candidate.scope} · {candidate.bytes} bytes · {candidate.populated ? "populated" : "empty"} · {candidate.version === null ? "no version" : `version ${candidate.version}`} · {candidate.reason}</p>)}{item.ambiguityReason ? <p className="text-amber-200/80">{item.ambiguityReason}</p> : null}</div></details>
          </div>
        ))}
      </section>
      <p className="text-xs text-white/40">Sources are retained. Account-scope candidates are reported but never selected by this inspection.</p>
    </main>
  );
}
