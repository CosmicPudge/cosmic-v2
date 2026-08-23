"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { SportsDirectoryEntry } from "@/services/sports/directory";
import { useCosmicScope } from "@/services/storage/scope";

interface SportsEntitySelectorProps {
  label: string;
  placeholder: string;
  entries?: SportsDirectoryEntry[];
  groups?: Array<{ label: string; entries: SportsDirectoryEntry[] }>;
  selectedIds: string[];
  onToggle: (entry: SportsDirectoryEntry) => void;
  onClear: () => void;
  summary?: string;
}

const keyFor = (entry: SportsDirectoryEntry) => entry.providerId ?? entry.id;

export default function SportsEntitySelector({ label, placeholder, entries = [], groups, selectedIds, onToggle, onClear, summary: suppliedSummary }: SportsEntitySelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [placement, setPlacement] = useState<"below" | "above">("below");
  const [maxHeight, setMaxHeight] = useState(360);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputId = useId();
  const scope = useCosmicScope();
  const menuGroups = useMemo(() => groups ?? [{ label: "All", entries }], [entries, groups]);
  const allEntries = menuGroups.flatMap((group) => group.entries);
  const selected = allEntries.filter((entry) => selectedIds.includes(keyFor(entry)));
  const filteredGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return menuGroups.map((group) => ({ ...group, entries: needle ? group.entries.filter((entry) => [entry.name, entry.shortName, entry.abbreviation, entry.id, entry.carNumber, entry.driverNumber].filter(Boolean).some((value) => value?.toLowerCase().includes(needle))) : group.entries })).filter((group) => group.entries.length > 0);
  }, [menuGroups, query]);
  const summary = suppliedSummary ?? (selected.length === 0 ? placeholder : selected.length === 1 ? selected[0].name : `${selected[0].name} + ${selected.length - 1} more`);

  const measure = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const margin = 12;
    const gap = 8;
    const rect = trigger.getBoundingClientRect();
    const availableBelow = Math.max(0, window.innerHeight - rect.bottom - margin - gap);
    const availableAbove = Math.max(0, rect.top - margin - gap);
    setPlacement(availableBelow >= availableAbove ? "below" : "above");
    setMaxHeight(Math.max(160, Math.min(420, Math.max(availableBelow, availableAbove))));
  }, []);

  const openSelector = () => {
    setOpen(true);
    window.setTimeout(measure, 0);
  };

  useEffect(() => {
    if (!open) return undefined;
    const refresh = () => measure();
    const close = (event: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false); };
    window.addEventListener("resize", refresh);
    window.addEventListener("scroll", refresh, true);
    document.addEventListener("mousedown", close);
    const timer = window.setTimeout(refresh, 0);
    return () => { window.clearTimeout(timer); window.removeEventListener("resize", refresh); window.removeEventListener("scroll", refresh, true); document.removeEventListener("mousedown", close); };
  }, [measure, open]);

  useEffect(() => {
    const timer = window.setTimeout(() => { setOpen(false); setQuery(""); }, 0);
    return () => window.clearTimeout(timer);
  }, [scope.id]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape") { setOpen(false); return; }
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); if (open) setOpen(false); else openSelector(); }
  };

  return <div ref={rootRef} className="relative min-w-0">
    <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">{label}</span>
    <button ref={triggerRef} type="button" aria-expanded={open} aria-controls={inputId} onClick={() => { if (open) setOpen(false); else openSelector(); }} onKeyDown={handleKeyDown} className="flex min-h-10 w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/15 px-3 text-left text-sm text-white/80 transition-colors hover:border-cyan-200/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/60">
      <span className={selected.length ? "truncate" : "truncate text-white/40"}>{summary}</span><span aria-hidden className="text-white/35">{open ? "⌃" : "⌄"}</span>
    </button>
    {open && <div id={inputId} style={{ maxHeight }} className={`absolute inset-x-0 z-30 flex flex-col overflow-hidden rounded-xl border border-white/15 bg-[#17232c]/95 shadow-2xl shadow-black/40 backdrop-blur-xl max-sm:fixed max-sm:inset-x-3 max-sm:bottom-3 max-sm:top-20 max-sm:mt-0 max-sm:mb-0 ${placement === "above" ? "bottom-[calc(100%+0.5rem)]" : "top-[calc(100%+0.5rem)]"}`}>
      <div className="border-b border-white/10 p-2"><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }} placeholder={`Search ${label.toLowerCase()}…`} aria-label={`Search ${label}`} className="h-9 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-200/45" /></div>
      {selected.length > 0 && <div className="shrink-0 border-b border-white/10 px-3 py-2"><div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-white/35"><span>Selected</span><button type="button" onClick={onClear} className="min-h-8 px-1 text-cyan-200/80 hover:text-cyan-100">Clear all</button></div><div className="flex max-h-20 flex-wrap gap-1.5 overflow-y-auto">{selected.map((entry) => <span key={entry.id} className="rounded-md bg-cyan-200/10 px-2 py-1 text-xs text-cyan-50">{entry.name}</span>)}</div></div>}
      <div role="listbox" aria-label={label} className="min-h-0 flex-1 overflow-y-auto p-1.5">{filteredGroups.length ? filteredGroups.map((group) => <div key={group.label}>{groups && <p className="px-2.5 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.14em] text-white/35">{group.label}</p>}{group.entries.map((entry) => { const checked = selectedIds.includes(keyFor(entry)); return <button key={entry.id} type="button" role="option" aria-selected={checked} onClick={() => onToggle(entry)} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-white/75 hover:bg-white/[0.08] focus-visible:bg-white/[0.08] focus-visible:outline-none"><span className={`flex size-4 shrink-0 items-center justify-center rounded border text-[10px] ${checked ? "border-cyan-200/70 bg-cyan-200/80 text-slate-900" : "border-white/20"}`}>{checked ? "✓" : ""}</span><span className="truncate">{entry.name}</span>{(entry.abbreviation || entry.carNumber || entry.driverNumber) && <span className="ml-auto text-[10px] text-white/30">{entry.abbreviation ?? `#${entry.carNumber ?? entry.driverNumber}`}</span>}</button>; })}</div>) : <p className="px-3 py-4 text-center text-sm text-white/40">No matches</p>}</div>
    </div>}
  </div>;
}
