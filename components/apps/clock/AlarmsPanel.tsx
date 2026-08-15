"use client";

import { useState } from "react";
import { AlarmClock, BellRing, Pencil, Plus, Trash2 } from "lucide-react";

import type { Alarm } from "@/core/contracts/Clock";
import { useClockData } from "./ClockProvider";
import {
  formatAlarmRepeat,
  formatNextOccurrence,
  getNextAlarmOccurrence,
} from "@/services/clock/time";

const weekdays = [
  { value: 0, label: "S" },
  { value: 1, label: "M" },
  { value: 2, label: "T" },
  { value: 3, label: "W" },
  { value: 4, label: "T" },
  { value: 5, label: "F" },
  { value: 6, label: "S" },
];

type AlarmDraft = Pick<Alarm, "id" | "label" | "time" | "enabled" | "repeatWeekdays" | "snoozeEnabled" | "createdAt">;

export default function AlarmsPanel({ now }: { now: number | null }) {
  const clock = useClockData();
  const [draft, setDraft] = useState<AlarmDraft | null>(null);

  const beginNewAlarm = () => {
    const current = new Date();
    current.setMinutes(current.getMinutes() + 1, 0, 0);
    setDraft({
      id: crypto.randomUUID(),
      label: "Alarm",
      time: `${current.getHours().toString().padStart(2, "0")}:${current.getMinutes().toString().padStart(2, "0")}`,
      enabled: true,
      repeatWeekdays: [],
      snoozeEnabled: true,
      createdAt: current.toISOString(),
    });
  };

  const saveDraft = () => {
    if (!draft) return;
    const existing = clock.data.alarms.find((alarm) => alarm.id === draft.id);
    clock.saveAlarm({
      ...existing,
      ...draft,
      label: draft.label.trim() || "Alarm",
      updatedAt: new Date().toISOString(),
      lastTriggeredAt: existing?.lastTriggeredAt,
      snoozedUntil: undefined,
    });
    setDraft(null);
  };

  return (
    <section aria-labelledby="alarms-heading" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-100/45">Wake and remember</p>
          <h2 id="alarms-heading" className="mt-2 text-3xl font-semibold tracking-tight">Alarms</h2>
        </div>
        <button type="button" onClick={beginNewAlarm} className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/8 px-4 py-2.5 text-sm font-medium transition hover:bg-white/13 focus-visible:outline-2 focus-visible:outline-cyan-200">
          <Plus size={17} /> New alarm
        </button>
      </div>

      <div className="rounded-2xl border border-amber-100/12 bg-amber-100/[0.055] px-4 py-3 text-sm leading-6 text-amber-50/65">
        Cosmic can trigger visual alarms while it is active. A closed browser, deep sleep, or operating-system suspension can delay them.
      </div>

      {draft && (
        <div className="rounded-[1.75rem] border border-cyan-100/16 bg-slate-950/58 p-5 backdrop-blur-2xl sm:p-7">
          <div className="grid gap-5 md:grid-cols-[1fr_12rem]">
            <label className="text-sm font-medium text-white/65">
              Label
              <input value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} className="mt-2 w-full rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none focus:border-cyan-100/45" />
            </label>
            <label className="text-sm font-medium text-white/65">
              Local time
              <input type="time" value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })} className="mt-2 w-full rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-white outline-none focus:border-cyan-100/45 [color-scheme:dark]" />
            </label>
          </div>
          <fieldset className="mt-6">
            <legend className="text-sm font-medium text-white/65">Repeat weekdays</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {weekdays.map((day) => {
                const selected = draft.repeatWeekdays.includes(day.value);
                return (
                  <button key={day.value} type="button" aria-label={`${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day.value]} ${selected ? "selected" : "not selected"}`} aria-pressed={selected} onClick={() => setDraft({ ...draft, repeatWeekdays: selected ? draft.repeatWeekdays.filter((value) => value !== day.value) : [...draft.repeatWeekdays, day.value] })} className={`h-10 w-10 rounded-full border text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-cyan-200 ${selected ? "border-cyan-100/40 bg-cyan-100 text-slate-950" : "border-white/12 bg-white/5 text-white/55 hover:text-white"}`}>
                    {day.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <label className="mt-6 flex items-center gap-3 text-sm text-white/65">
            <input type="checkbox" checked={draft.snoozeEnabled} onChange={(event) => setDraft({ ...draft, snoozeEnabled: event.target.checked })} className="h-4 w-4 accent-cyan-200" />
            Allow 9-minute snooze
          </label>
          <div className="mt-7 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={() => setDraft(null)} className="rounded-xl px-4 py-2 text-sm text-white/55 transition hover:bg-white/8 hover:text-white">Cancel</button>
            <button type="button" onClick={saveDraft} className="rounded-xl bg-cyan-100 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-white focus-visible:outline-2 focus-visible:outline-cyan-200">Save alarm</button>
          </div>
        </div>
      )}

      {clock.data.alarms.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-white/14 bg-white/[0.035] px-6 py-16 text-center">
          <AlarmClock className="mx-auto text-cyan-100/45" size={34} />
          <h3 className="mt-5 text-xl font-medium">No alarms</h3>
          <p className="mt-2 text-sm text-white/45">Create a one-time or repeating local alarm.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {clock.data.alarms.map((alarm) => {
            const next = now === null ? null : getNextAlarmOccurrence(alarm, now);
            return (
              <article key={alarm.id} className={`rounded-[1.6rem] border p-5 backdrop-blur-xl transition ${alarm.enabled ? "border-cyan-100/16 bg-white/[0.06]" : "border-white/8 bg-black/15 opacity-70"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-cyan-100/50"><BellRing size={16} /><span className="text-xs uppercase tracking-[0.24em]">{formatAlarmRepeat(alarm.repeatWeekdays)}</span></div>
                    <p className="mt-4 text-4xl font-light tabular-nums tracking-[-0.04em]">{alarm.time}</p>
                    <h3 className="mt-2 font-medium">{alarm.label}</h3>
                    <p className="mt-1 text-sm text-white/42">{next ? formatNextOccurrence(next) : alarm.enabled ? "Scheduling…" : "Disabled"}</p>
                  </div>
                  <button type="button" role="switch" aria-checked={alarm.enabled} aria-label={`${alarm.enabled ? "Disable" : "Enable"} ${alarm.label}`} onClick={() => clock.saveAlarm({ ...alarm, enabled: !alarm.enabled, snoozedUntil: undefined, updatedAt: new Date().toISOString() })} className={`relative h-7 w-12 rounded-full border transition focus-visible:outline-2 focus-visible:outline-cyan-200 ${alarm.enabled ? "border-cyan-100/40 bg-cyan-200/35" : "border-white/12 bg-white/8"}`}>
                    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${alarm.enabled ? "left-6" : "left-1"}`} />
                  </button>
                </div>
                <div className="mt-6 flex justify-end gap-2 border-t border-white/8 pt-4">
                  <button type="button" aria-label={`Edit ${alarm.label}`} onClick={() => setDraft(alarm)} className="rounded-xl p-2 text-white/45 transition hover:bg-white/8 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-200"><Pencil size={17} /></button>
                  <button type="button" aria-label={`Delete ${alarm.label}`} onClick={() => clock.removeAlarm(alarm.id)} className="rounded-xl p-2 text-white/45 transition hover:bg-red-300/10 hover:text-red-100 focus-visible:outline-2 focus-visible:outline-cyan-200"><Trash2 size={17} /></button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
