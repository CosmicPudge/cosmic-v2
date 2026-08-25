"use client";

import { useState } from "react";
import { ArrowRight, Maximize2, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { apps } from "@/config/apps";
import { useSearchRuntime } from "@/components/apps/search/SearchProvider";
import { useSearchResults } from "@/hooks/os/useSearch";
import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import { useWidgetContext } from "@/components/os/ui/widget/WidgetContext";

export default function SearchWidget() {
  const router = useRouter();
  const { size } = useWidgetContext();
  const { openSearch, recentSearches, recordSearch } = useSearchRuntime();
  const [query, setQuery] = useState("");
  const snapshot = useSearchResults(size === "large" ? query : "");
  const destinations = apps.filter((app) => ["calendar", "garage", "projects", "notes"].includes(app.id));

  if (size === "small") {
    return (
      <Widget accent="search" hover>
        <button type="button" onClick={() => openSearch()} className="flex h-full min-h-0 w-full flex-col items-start justify-between text-left" aria-label="Open Cosmic Search">
          <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.07]"><Search className="h-4 w-4 text-cyan-100/70" /></span>
          <span><span className="block text-base font-semibold text-white">Search Cosmic</span><span className="mt-1 block text-xs text-white/45">⌘ K from anywhere</span></span>
        </button>
      </Widget>
    );
  }

  const submit = () => {
    openSearch(query.trim() ? query : undefined);
  };

  return (
    <Widget accent="search">
      <WidgetHeader
        eyebrow="Global"
        title="Search"
        subtitle="Find anything in Cosmic"
        action={<button type="button" onClick={() => openSearch(query)} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/55 transition hover:bg-white/10 hover:text-white" aria-label="Open full Search"><Maximize2 className="h-4 w-4" /></button>}
      />
      <WidgetBody className="gap-3">
        <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="relative shrink-0">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Apps, events, notes…" className="h-11 w-full rounded-2xl border border-white/10 bg-black/10 pl-10 pr-12 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-cyan-200/30 focus:bg-white/[0.05]" />
          <button type="submit" className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-white/35 transition hover:bg-white/10 hover:text-white" aria-label="Open Search results"><ArrowRight className="h-4 w-4" /></button>
        </form>

        {size === "large" && query.trim() ? (
          <div className="min-h-0 space-y-1 overflow-y-auto">
            {snapshot.results.slice(0, 4).map((result) => (
              <button key={`${result.source}:${result.id}`} type="button" onClick={() => { recordSearch(query); if (result.href) router.push(result.href); }} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-white/[0.07]">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-sm">{result.icon ?? "⌕"}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-white/76">{result.title}</span><span className="block truncate text-[11px] capitalize text-white/34">{result.subtitle ?? result.category}</span></span>
              </button>
            ))}
            {snapshot.complete && snapshot.results.length === 0 && <p className="px-3 py-4 text-center text-xs text-white/38">No results yet. Open full Search for shortcuts.</p>}
          </div>
        ) : (
          <div className="grid min-h-0 grid-cols-2 gap-2 overflow-hidden">
            {(recentSearches.length ? recentSearches.slice(0, 4).map((item) => ({ id: item.query, name: item.query, icon: "⌕", route: "" })) : destinations).map((item) => (
              <button key={item.id} type="button" onClick={() => item.route ? router.push(item.route) : openSearch(item.name)} className="flex min-w-0 items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-left text-xs text-white/55 transition hover:bg-white/[0.07] hover:text-white">
                <span className="shrink-0">{item.icon}</span><span className="truncate">{item.name}</span>
              </button>
            ))}
          </div>
        )}
      </WidgetBody>
    </Widget>
  );
}
