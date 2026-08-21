"use client";

import useCosmicContext from "@/hooks/os/useCosmicContext";

export default function ContextInspector() {
  const context = useCosmicContext();
  return <main className="mx-auto min-h-screen max-w-5xl space-y-6 p-6 text-white"><div><p className="text-xs uppercase tracking-[0.2em] text-white/45">Developer tools</p><h1 className="mt-2 text-3xl font-semibold">Context inspector</h1><p className="mt-2 text-white/55">Deterministic candidates, ranked without exposing sensitive source content.</p></div><section className="grid gap-3">{context.candidates.map((item) => <article key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-medium">{item.title}</h2><span className="text-xs uppercase tracking-widest text-white/45">{item.priority} · {item.source}</span></div><p className="mt-1 text-sm text-white/55">{item.kind}{item.subtitle ? ` · ${item.subtitle}` : ""}</p><p className="mt-2 break-all text-xs text-white/35">{item.id}</p></article>)}{!context.candidates.length && <p className="text-white/50">No context candidates.</p>}</section></main>;
}
