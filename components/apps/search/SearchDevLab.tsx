"use client";

import { useState } from "react";
import { CheckCircle2, FlaskConical } from "lucide-react";

import { SearchEngine } from "@/core/search/SearchEngine";
import SearchSurface from "./SearchSurface";

const scenarios = [
  { label: "Empty", query: "" },
  { label: "Single app", query: "calendar" },
  { label: "Many", query: "a" },
  { label: "Long query", query: "quarterly spacecraft maintenance planning document" },
] as const;

export default function SearchDevLab() {
  const [scenario, setScenario] = useState<(typeof scenarios)[number]>(scenarios[0]);
  const [probe, setProbe] = useState<"idle" | "running" | "passed" | "failed">("idle");

  const runFailureProbe = async () => {
    setProbe("running");
    const engine = new SearchEngine();
    engine.register({ id: "healthy", categories: ["apps"], search: () => [{ id: "probe", category: "apps", title: "Probe", href: "/search", source: "healthy" }] });
    engine.register({ id: "offline", categories: ["calendar"], search: () => { throw new Error("Expected dev failure"); } });
    const result = await engine.search("probe", { remoteDelayMs: 0 });
    setProbe(result.results.length === 1 && result.warnings.length === 1 ? "passed" : "failed");
  };

  return (
    <main className="min-h-screen bg-black/10 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/42"><FlaskConical className="h-4 w-4" /> Development preview</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Search lab</h1>
          <p className="mt-2 text-sm text-white/42">Production engine, deterministic scenarios, and constrained phone layout.</p>
        </header>

        <div className="mb-5 flex flex-wrap gap-2">
          {scenarios.map((item) => <button key={item.label} type="button" onClick={() => setScenario(item)} className={`rounded-full border px-4 py-2 text-sm transition ${scenario.label === item.label ? "border-cyan-200/30 bg-cyan-200/12 text-white" : "border-white/10 bg-white/5 text-white/55"}`}>{item.label}</button>)}
          <button type="button" onClick={() => void runFailureProbe()} className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 transition hover:bg-white/10 hover:text-white">
            {probe === "passed" && <CheckCircle2 className="h-4 w-4 text-emerald-300" />} Failure isolation: {probe}
          </button>
        </div>

        <div className="grid min-w-0 items-start gap-7 xl:grid-cols-[minmax(0,1fr)_390px]">
          <section className="min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-[#070c18]/72 p-5 backdrop-blur-2xl" aria-label="Desktop Search preview">
            <SearchSurface key={`desktop:${scenario.label}`} initialQuery={scenario.query} />
          </section>
          <section className="min-w-0 w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#070c18]/72 p-3 backdrop-blur-2xl xl:w-[390px]" aria-label="390 pixel Search preview">
            <SearchSurface key={`phone:${scenario.label}`} initialQuery={scenario.query} />
          </section>
        </div>
      </div>
    </main>
  );
}
