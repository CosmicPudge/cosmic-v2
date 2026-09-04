"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function StudyDashboardCard() {
  const [due, setDue] = useState<number | null>(null);
  useEffect(() => { void fetch("/api/school/study/overview", { cache: "no-store" }).then((response) => response.ok ? response.json() as Promise<{ dueCount: number }> : Promise.reject()).then((body) => setDue(body.dueCount)).catch(() => setDue(null)); }, []);
  if (due === null) return null;
  return <section className="rounded-[1.35rem] border border-white/[0.09] bg-[#101c35]/75 p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200/60">Study</p><h2 className="mt-1 text-xl font-semibold text-white">Keep your review loop moving</h2><p className="mt-2 text-sm text-white/50">{due ? `${due} card${due === 1 ? "" : "s"} due for review.` : "No cards due right now."}</p></div><Link href="/school/study" className="shrink-0 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70 transition hover:bg-white/[0.05]">Open Study</Link></div></section>;
}
