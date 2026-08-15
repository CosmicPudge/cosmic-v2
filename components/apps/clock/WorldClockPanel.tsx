"use client";

import { useMemo, useState } from "react";
import { Globe2, Plus, Search, Trash2 } from "lucide-react";

import { useClockData } from "./ClockProvider";
import {
  COMMON_TIME_ZONES,
  formatClockTime,
  formatDayDifference,
  formatShortDate,
  formatTimeZoneOffset,
  getWorldClockDayDifference,
} from "@/services/clock/time";

export default function WorldClockPanel({ now }: { now: number | null }) {
  const clock = useClockData();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const available = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return COMMON_TIME_ZONES.filter((zone) =>
      !clock.data.worldClocks.some((location) => location.timeZone === zone.timeZone)
      && (!normalized || `${zone.label} ${zone.timeZone}`.toLowerCase().includes(normalized)),
    );
  }, [clock.data.worldClocks, query]);

  const addLocation = (label: string, timeZone: string) => {
    clock.saveWorldClock({
      id: crypto.randomUUID(),
      label,
      timeZone,
      createdAt: new Date().toISOString(),
    });
    setQuery("");
    setAdding(false);
  };

  return (
    <section aria-labelledby="world-clock-heading" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-100/45">Across the planet</p>
          <h2 id="world-clock-heading" className="mt-2 text-3xl font-semibold tracking-tight">World Clock</h2>
        </div>
        <button type="button" onClick={() => setAdding((value) => !value)} className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/8 px-4 py-2.5 text-sm font-medium transition hover:bg-white/13 focus-visible:outline-2 focus-visible:outline-cyan-200">
          <Plus size={17} /> Add location
        </button>
      </div>

      {adding && (
        <div className="rounded-[1.6rem] border border-cyan-100/15 bg-slate-950/55 p-4 backdrop-blur-2xl sm:p-6">
          <label htmlFor="world-clock-search" className="text-sm font-medium text-white/70">Search common IANA timezones</label>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" size={18} />
            <input id="world-clock-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="City or timezone" className="w-full rounded-2xl border border-white/12 bg-black/25 py-3 pl-11 pr-4 text-white outline-none placeholder:text-white/30 focus:border-cyan-100/45" />
          </div>
          <div className="mt-3 grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
            {available.map((zone) => (
              <button key={zone.timeZone} type="button" onClick={() => addLocation(zone.label, zone.timeZone)} className="rounded-xl border border-white/8 bg-white/[0.045] px-4 py-3 text-left transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-cyan-200">
                <span className="block font-medium">{zone.label}</span>
                <span className="mt-0.5 block text-xs text-white/40">{zone.timeZone}</span>
              </button>
            ))}
            {available.length === 0 && <p className="py-8 text-center text-sm text-white/45 sm:col-span-2">No matching location is available.</p>}
          </div>
        </div>
      )}

      {clock.data.worldClocks.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-white/14 bg-white/[0.035] px-6 py-16 text-center">
          <Globe2 className="mx-auto text-cyan-100/45" size={34} />
          <h3 className="mt-5 text-xl font-medium">No world clocks yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/45">Add a city to compare its current IANA timezone, calendar day, and UTC offset.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {clock.data.worldClocks.map((location) => {
            const difference = now === null ? 0 : getWorldClockDayDifference(now, location.timeZone);
            return (
              <article key={location.id} className="group rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-medium">{location.label}</h3>
                    <p className="mt-1 truncate text-xs text-white/38">{location.timeZone}</p>
                  </div>
                  <button type="button" aria-label={`Remove ${location.label}`} onClick={() => clock.removeWorldClock(location.id)} className="rounded-xl p-2 text-white/35 transition hover:bg-red-300/10 hover:text-red-100 focus-visible:outline-2 focus-visible:outline-cyan-200">
                    <Trash2 size={17} />
                  </button>
                </div>
                <p className="mt-8 text-4xl font-light tabular-nums tracking-[-0.04em] sm:text-5xl">
                  {now === null ? "--:--" : formatClockTime(now, clock.data.preferences.hourFormat, { timeZone: location.timeZone })}
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-white/55">{now === null ? "Synchronizing" : formatShortDate(now, location.timeZone)}</span>
                  <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-cyan-100/65">
                    {now === null ? "Today" : formatDayDifference(difference)} · {now === null ? "UTC" : formatTimeZoneOffset(now, location.timeZone)}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
