"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  CornerDownLeft,
  LoaderCircle,
  Search,
  X,
} from "lucide-react";
import clsx from "clsx";

import { apps } from "@/config/apps";
import type { SearchCategory, SearchResult } from "@/core/contracts/Search";
import { useSearchResults } from "@/hooks/os/useSearch";
import { useSearchRuntime } from "./SearchProvider";
import { useEntitlements } from "@/hooks/os/useEntitlements";

const categories: Array<{ id: SearchCategory | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "apps", label: "Apps" },
  { id: "settings", label: "Settings" },
  { id: "system", label: "System" },
  { id: "calendar", label: "Calendar" },
  { id: "mail", label: "Mail" },
  { id: "school", label: "School" },
  { id: "sports", label: "Sports" },
  { id: "garage", label: "Garage" },
  { id: "projects", label: "Projects" },
  { id: "notes", label: "Notes" },
  { id: "clock", label: "Clock" },
  { id: "music", label: "Music" },
  { id: "files", label: "Files" },
];

function categoryForPath(pathname: string): SearchCategory | undefined {
  const segment = pathname.split("/").filter(Boolean)[0];
  const category = segment === "gmail" || segment === "outlook" ? "mail" : segment;
  return categories.some((entry) => entry.id === category) ? category as SearchCategory : undefined;
}

function resultLabel(result: SearchResult) {
  return `${result.title}, ${result.category}${result.subtitle ? `, ${result.subtitle}` : ""}`;
}

interface SearchSurfaceProps {
  mode?: "page" | "overlay";
  initialQuery?: string;
  autoFocus?: boolean;
  onClose?: () => void;
}

export default function SearchSurface({
  mode = "page",
  initialQuery = "",
  autoFocus = false,
  onClose,
}: SearchSurfaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<SearchCategory | "all">("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { engine, recentSearches, recordSearch, clearRecents } = useSearchRuntime();
  const { data: entitlements } = useEntitlements();
  const snapshot = useSearchResults(query, category, categoryForPath(pathname));
  const registeredCategories = useMemo(() => new Set(engine.getCategories()), [engine]);
  const visibleCategories = categories.filter((entry) => (entry.id !== "school" || entitlements.features["school.basic"]) && (entry.id === "all" || registeredCategories.has(entry.id)));
  const selected = snapshot.results[selectedIndex];
  const resultId = selected ? `cosmic-search-result-${selected.source}-${selected.category}-${selected.id}`.replace(/[^a-zA-Z0-9-_]/g, "-") : undefined;

  useEffect(() => {
    if (!autoFocus) return;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(frame);
  }, [autoFocus]);

  const updateQuery = (value: string) => {
    setQuery(value);
    setSelectedIndex(0);
  };

  const updateCategory = (value: SearchCategory | "all") => {
    setCategory(value);
    setSelectedIndex(0);
    inputRef.current?.focus({ preventScroll: true });
  };

  const openResult = (result: SearchResult) => {
    if (query.trim()) recordSearch(query);
    onClose?.();
    if (result.href?.includes("#")) {
      window.location.assign(result.href);
    } else if (result.href) {
      router.push(result.href);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((index) => snapshot.results.length ? (index + 1) % snapshot.results.length : 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((index) => snapshot.results.length ? (index - 1 + snapshot.results.length) % snapshot.results.length : 0);
    } else if (event.key === "Enter" && selected) {
      event.preventDefault();
      openResult(selected);
    } else if (event.key === "Escape") {
      event.preventDefault();
      if (mode === "overlay") onClose?.();
      else if (query) updateQuery("");
      else inputRef.current?.blur();
    }
  };

  return (
    <section className={clsx("flex min-h-0 flex-col", mode === "overlay" ? "max-h-[min(760px,86svh)]" : "min-h-[620px]")} aria-label="Cosmic Search">
      <div className={clsx("relative flex items-center", mode === "overlay" ? "px-4 pt-4 sm:px-6 sm:pt-6" : "") }>
        <Search className="pointer-events-none absolute left-4 h-5 w-5 text-cyan-100/60 sm:left-5 sm:h-6 sm:w-6" aria-hidden="true" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-label="Search Cosmic"
          aria-expanded={Boolean(query)}
          aria-controls="cosmic-search-results"
          aria-activedescendant={resultId}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          placeholder="Search apps, events, notes, projects…"
          className={clsx(
            "w-full rounded-[1.4rem] border border-white/12 bg-white/[0.07] pl-12 pr-12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_18px_80px_rgba(0,0,0,.16)] outline-none transition placeholder:text-white/32 focus:border-cyan-200/35 focus:bg-white/[0.09] focus:ring-4 focus:ring-cyan-300/[0.06] sm:pl-14",
            mode === "overlay" ? "h-16 text-lg sm:h-[4.5rem] sm:text-xl" : "h-[4.5rem] text-lg sm:h-20 sm:text-2xl",
          )}
        />
        {query ? (
          <button type="button" onClick={() => updateQuery("")} className="absolute right-4 grid h-8 w-8 place-items-center rounded-full text-white/45 transition hover:bg-white/10 hover:text-white sm:right-5" aria-label="Clear search">
            <X className="h-4 w-4" />
          </button>
        ) : (
          <kbd className="pointer-events-none absolute right-4 hidden rounded-lg border border-white/10 bg-black/15 px-2 py-1 text-[11px] text-white/42 sm:block">⌘ K</kbd>
        )}
      </div>

      <nav className={clsx("no-scrollbar flex shrink-0 gap-2 overflow-x-auto py-4", mode === "overlay" ? "px-4 sm:px-6" : "") } aria-label="Search categories">
        {visibleCategories.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => updateCategory(entry.id)}
            className={clsx(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition sm:px-4 sm:py-2 sm:text-sm",
              category === entry.id ? "border-cyan-200/30 bg-cyan-200/12 text-cyan-50" : "border-white/9 bg-white/[0.035] text-white/52 hover:border-white/16 hover:bg-white/[0.07] hover:text-white/80",
            )}
            aria-pressed={category === entry.id}
          >
            {entry.label}
          </button>
        ))}
      </nav>

      <div id="cosmic-search-results" role="listbox" aria-label="Search results" className={clsx("min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4", mode === "overlay" ? "px-2 sm:px-4" : "") }>
        {!query.trim() ? (
          <div className="grid gap-7 px-2 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,.8fr)] sm:px-3 sm:py-5">
            <section>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/38">Quick access</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {apps.filter((app) => ["calendar", "garage", "projects", "notes", "music", "clock"].includes(app.id)).map((app) => (
                  <button key={app.id} type="button" onClick={() => router.push(app.route)} className="group flex min-w-0 items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.035] p-3 text-left transition hover:border-cyan-100/20 hover:bg-white/[0.075]">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.07] text-lg">{app.icon}</span>
                    <span className="truncate text-sm font-medium text-white/74 group-hover:text-white">{app.name}</span>
                  </button>
                ))}
              </div>
            </section>
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/38">Recent searches</p>
                {recentSearches.length > 0 && <button type="button" onClick={clearRecents} className="text-xs text-white/38 transition hover:text-white/70">Clear</button>}
              </div>
              {recentSearches.length ? (
                <div className="space-y-1">
                  {recentSearches.slice(0, 5).map((recent) => (
                    <button key={`${recent.query}:${recent.searchedAt}`} type="button" onClick={() => updateQuery(recent.query)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-white/60 transition hover:bg-white/[0.06] hover:text-white">
                      <Search className="h-3.5 w-3.5 text-white/30" />
                      <span className="truncate">{recent.query}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-white/10 px-4 py-5 text-sm leading-6 text-white/38">Your recent query text stays only on this device.</p>
              )}
            </section>
          </div>
        ) : snapshot.results.length ? (
          <div className="space-y-1">
            {snapshot.results.map((result, index) => {
              const id = `cosmic-search-result-${result.source}-${result.category}-${result.id}`.replace(/[^a-zA-Z0-9-_]/g, "-");
              return (
                <button
                  key={`${result.source}:${result.category}:${result.id}`}
                  id={id}
                  type="button"
                  role="option"
                  aria-selected={index === selectedIndex}
                  aria-label={resultLabel(result)}
                  onPointerMove={() => setSelectedIndex(index)}
                  onClick={() => openResult(result)}
                  className={clsx(
                    "group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition sm:gap-4 sm:px-4",
                    index === selectedIndex ? "border-cyan-200/22 bg-cyan-100/[0.09] shadow-[0_8px_30px_rgba(18,198,210,.06)]" : "border-transparent hover:bg-white/[0.045]",
                  )}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[.9rem] border border-white/8 bg-white/[0.055] text-base text-white/78 sm:h-11 sm:w-11">{result.icon ?? "⌕"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-medium text-white/88 sm:text-[15px]">{result.title}</span>
                      <span className="shrink-0 rounded-full bg-white/[0.055] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/38">{result.category}</span>
                    </span>
                    {result.subtitle && <span className="mt-0.5 block truncate text-xs text-white/48 sm:text-sm">{result.subtitle}</span>}
                    {result.description && <span className="mt-0.5 block truncate text-xs text-white/32">{result.description}</span>}
                  </span>
                  <CornerDownLeft className={clsx("h-4 w-4 shrink-0 transition", index === selectedIndex ? "text-cyan-100/65" : "text-transparent group-hover:text-white/30")} />
                </button>
              );
            })}
          </div>
        ) : snapshot.complete ? (
          <div className="grid min-h-64 place-items-center px-5 text-center">
            <div>
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-white/8 bg-white/[0.04] text-white/35"><Search className="h-5 w-5" /></span>
              <p className="mt-4 text-base font-medium text-white/70">No Cosmic results for “{snapshot.query.original}”</p>
              <p className="mt-1 text-sm text-white/38">Try another phrase or open an app from Quick access.</p>
            </div>
          </div>
        ) : (
          <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-white/42"><LoaderCircle className="h-4 w-4 animate-spin" /> Searching Cosmic</div>
        )}
      </div>

      <footer className={clsx("flex shrink-0 items-center justify-between gap-3 border-t border-white/8 py-3 text-[11px] text-white/32", mode === "overlay" ? "px-4 sm:px-6" : "") }>
        <span className="flex items-center gap-3"><span className="inline-flex items-center gap-1"><ArrowUp className="h-3 w-3" /><ArrowDown className="h-3 w-3" /> Select</span><span className="inline-flex items-center gap-1"><CornerDownLeft className="h-3 w-3" /> Open</span></span>
        <span>{!snapshot.complete && query ? "Updating…" : snapshot.warnings.length ? "Some sources unavailable" : query ? `${snapshot.results.length} results` : "Local & private"}</span>
      </footer>
    </section>
  );
}
