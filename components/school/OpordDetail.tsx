"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { OpordDocument, OpordEvent, OpordField } from "@/services/school/opord/types";
import { OPORD_PARSER_VERSION } from "@/services/school/opord/parser";
import { isCurrentOpordDocument } from "@/services/school/opord/process";
import { resolvedUniform } from "@/services/school/opord/selectors";

function field<T>(item: OpordField<T>) { return item.status === "explicit" ? String(item.value) : item.status === "conflicting" ? `Conflicting: ${item.values.join(" / ")}` : "Not specified in OPORD"; }
function EventDetail({ event, category }: { event: OpordEvent; category: string }) { const uniform = resolvedUniform(event, category); return <article id={event.id} className="scroll-mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5"><h3 className="text-lg font-medium text-white">{event.title}</h3><p className="mt-1 text-sm text-sky-100/70">{field(event.date)} · {event.status}</p><div className="mt-4 grid gap-2 text-sm text-white/65 sm:grid-cols-2"><p><b className="text-white/40">Report / pre-formation:</b> {field(event.reportTime)}</p><p><b className="text-white/40">Start / formation:</b> {field(event.startTime)}</p><p><b className="text-white/40">End:</b> {field(event.endTime)}</p><p><b className="text-white/40">Form-up location:</b> {field(event.formUpLocation)}</p><p><b className="text-white/40">What you wear:</b> {uniform ?? (event.uniformRequirements.length ? category ? "Uniform mapping unavailable for selected category" : "Varies by cadet category" : field(event.uniform))}</p></div>{event.uniformRequirements.length ? <details className="mt-3"><summary className="cursor-pointer text-xs text-sky-200/60">View all cadet categories</summary>{event.uniformRequirements.map((item) => <p key={`${item.audience}:${item.uniform}`} className="mt-2 text-sm text-white/65">{item.audience}: {item.uniform}{item.excerpt ? <span className="ml-2 text-xs text-white/35">Source: Page {event.diagnostics?.sourcePage ?? "?"} · UOD</span> : null}</p>)}</details> : null}{event.activityLocations.length ? <p className="mt-4 text-sm text-white/65"><b className="text-white/40">Activity locations:</b> {event.activityLocations.join(", ")}</p> : null}{event.bring.length ? <p className="mt-4 text-sm text-white/65"><b className="text-white/40">Bring:</b> {event.bring.join(", ")}</p> : null}{event.timeline.length ? <section className="mt-5"><h4 className="text-xs uppercase tracking-[0.18em] text-white/40">Timeline</h4>{event.timeline.map((line) => <p key={line} className="mt-1 text-sm text-white/65">{line}</p>)}</section> : null}{event.workouts.map((workout) => <section key={`${workout.title}:${workout.sourcePage ?? ""}`} className="mt-5 rounded-xl border border-emerald-200/10 bg-emerald-200/[0.04] p-4"><h4 className="text-xs uppercase tracking-[0.18em] text-emerald-100/70">PT workout · {workout.title}</h4>{workout.totalRepetitions ? <p className="mt-2 text-sm text-white/70">Target: {workout.totalRepetitions} total repetitions</p> : null}{workout.blocks.map((block) => <div key={block.category} className="mt-4"><h5 className="text-sm font-semibold text-white">{block.category}</h5>{block.exercises.map((item) => <p key={`${item.name}:${item.reps ?? ""}`} className="mt-1 text-sm text-white/70">{item.reps ? `${item.reps} ` : ""}{item.name}{item.durationMinutes ? ` · ${item.durationMinutes} min` : ""}</p>)}{block.running.map((item) => <p key={`${item.name}:${item.distance ?? ""}`} className="mt-1 text-sm text-white/70">{item.name} · {item.distance ?? "distance not specified"}</p>)}</div>)}<p className="mt-4 text-xs text-white/40">Source: {workout.source}{workout.sourcePage ? ` · Page ${workout.sourcePage}` : ""}</p></section>)}{event.specialConditions.length ? <section className="mt-5 rounded-xl border border-amber-200/10 bg-amber-200/[0.04] p-4"><h4 className="text-xs uppercase tracking-[0.18em] text-amber-100/70">Special condition</h4>{event.specialConditions.map((item) => <p key={item} className="mt-2 text-sm text-white/65">{item}</p>)}</section> : null}<details className="mt-5"><summary className="cursor-pointer text-xs text-sky-200/60">Show source excerpt</summary><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-white/45">{event.provenance.excerpt}</p></details></article>; }
export default function OpordDetail() {
  const params = useParams<{ sourceId: string }>();
  const [document, setDocument] = useState<OpordDocument | null>(null);
  const [source, setSource] = useState<{ title: string; originalFileName: string | null } | null>(null);
  const [error, setError] = useState("");
  const [category] = useState(() => typeof window === "undefined" ? "" : window.localStorage.getItem("cosmic.afrotc.cadet-category") ?? "");
  const [reprocessMessage, setReprocessMessage] = useState("");
  const [reprocessing, setReprocessing] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(`/api/school/opords/${encodeURIComponent(params.sourceId)}`, { cache: "no-store" });
    const body = await response.json() as { error?: string; source?: { title: string; originalFileName: string | null; document: OpordDocument } };
    if (!response.ok || !body.source) throw new Error(body.error ?? "OPORD not found.");
    setSource(body.source);
    setDocument(body.source.document);
  }, [params.sourceId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load().catch((reason) => setError(reason instanceof Error ? reason.message : "OPORD not found.")); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function reprocess() {
    if (reprocessing) return;
    setReprocessing(true);
    setReprocessMessage("");
    try {
      const response = await fetch(`/api/school/opords/${encodeURIComponent(params.sourceId)}/reprocess`, { method: "POST" });
      const body = await response.json() as { error?: string; document?: OpordDocument; parserVersion?: string | null; eventCount?: number; sourcePages?: (number | null)[]; processingStatus?: string; readbackVerified?: boolean };
      const verified = response.ok && body.readbackVerified === true && body.parserVersion === OPORD_PARSER_VERSION && body.document?.parserVersion === OPORD_PARSER_VERSION && body.eventCount === body.document.events.length;
      if (!verified) {
        setReprocessMessage(body.error ?? "Reprocess did not update this OPORD.");
        return;
      }
      setDocument(body.document ?? null);
      setReprocessMessage(`Reprocessed with OPORD Parser V4\n${body.eventCount} operational events found`);
      await load();
    } catch {
      setReprocessMessage("Reprocess did not update this OPORD.");
    } finally {
      setReprocessing(false);
    }
  }

  if (error) return <div className="space-y-4"><Link href="/school/opords" className="text-sm text-sky-200/75">← OPORDs</Link><p className="text-sm text-amber-100/75">{error}</p></div>;
  if (!document || !source) return <p className="text-sm text-white/50">Loading OPORD…</p>;
  const events = document.events.filter((event) => event.type === "llab" || event.type === "pt");
  const sourcePages = [...new Set(document.events.map((event) => event.diagnostics?.sourcePage).filter((page): page is number => typeof page === "number"))].sort((a, b) => a - b);
  const stale = !isCurrentOpordDocument(document);
  return <div className="space-y-6">
    <Link href="/school/opords" className="text-sm text-sky-200/75">← OPORDs</Link>
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.25em] text-sky-200/55">{source.originalFileName}</p><h1 className="mt-2 text-3xl font-semibold text-white">{source.title}</h1></div><button type="button" onClick={() => void reprocess()} disabled={reprocessing} className="rounded-xl border border-sky-200/20 bg-sky-200/10 px-4 py-2 text-sm text-sky-50 disabled:cursor-wait disabled:opacity-60">{reprocessing ? "Reprocessing…" : "Reprocess OPORD"}</button></header>
    {stale ? <section className="rounded-xl border border-amber-200/20 bg-amber-200/[0.06] p-4 text-sm text-amber-100/80" role="status">This OPORD was processed by an older parser. Reprocess to update its event intelligence.</section> : null}
    {reprocessMessage ? <p className="whitespace-pre-line rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-amber-100/80" role="status">{reprocessMessage}</p> : null}
    <section className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:grid-cols-2"><p className="text-sm text-white/65"><b className="text-white/40">OPORD number:</b> {field(document.opordNumber)}</p><p className="text-sm text-white/65"><b className="text-white/40">Organization:</b> {field(document.organization)}</p><p className="text-sm text-white/65"><b className="text-white/40">Effective date:</b> {field(document.effectiveDate)}</p><p className="text-sm text-white/65"><b className="text-white/40">Purpose:</b> {field(document.purpose)}</p></section>
    <section className="rounded-xl border border-violet-200/15 bg-violet-200/[0.04] p-4"><p className="text-[10px] uppercase tracking-[0.2em] text-violet-200/60">Parser</p><p className="mt-1 text-sm text-white/75">{document.parserVersion === OPORD_PARSER_VERSION ? "V4 real extraction" : document.parserVersion ?? "Unknown / legacy parser"}</p><p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-violet-200/60">Events</p><p className="mt-1 text-sm text-white/75">{document.events.length}</p><p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-violet-200/60">Source pages</p><p className="mt-1 text-sm text-white/75">{sourcePages.length ? sourcePages.join(" · ") : "Not recorded"}</p></section>
    <section><h2 className="mb-3 text-xs uppercase tracking-[0.22em] text-white/45">Events</h2><div className="space-y-4">{events.map((event) => <EventDetail key={event.id} event={event} category={category} />)}</div></section>
  </div>;
}
