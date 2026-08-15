"use client";

import { useState } from "react";
import { Pause, Play, Plus, RotateCcw, Timer, Trash2 } from "lucide-react";

import { useClockData } from "./ClockProvider";
import { formatDuration, getTimerRemaining } from "@/services/clock/time";

export default function TimersPanel({ now }: { now: number | null }) {
  const clock = useClockData();
  const [label, setLabel] = useState("Timer");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);

  const addTimer = (durationMs: number, timerLabel: string, startImmediately = false) => {
    if (durationMs <= 0) return;
    const id = crypto.randomUUID();
    const startedAt = Date.now();
    const createdAt = new Date(startedAt).toISOString();
    clock.createTimer({
      id,
      label: timerLabel.trim() || "Timer",
      durationMs,
      status: startImmediately ? "running" : "idle",
      remainingAtPause: durationMs,
      createdAt,
      startedAt: startImmediately ? startedAt : undefined,
      targetEndAt: startImmediately ? startedAt + durationMs : undefined,
    });
  };

  const customDuration = (hours * 3_600 + minutes * 60 + seconds) * 1_000;

  return (
    <section aria-labelledby="timers-heading" className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-100/45">Accurate countdowns</p>
        <h2 id="timers-heading" className="mt-2 text-3xl font-semibold tracking-tight">Timers</h2>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl sm:p-7">
        <div className="grid gap-4 md:grid-cols-[minmax(10rem,1fr)_repeat(3,6rem)_auto] md:items-end">
          <label className="text-sm font-medium text-white/60">Label<input value={label} onChange={(event) => setLabel(event.target.value)} className="mt-2 w-full rounded-xl border border-white/12 bg-black/25 px-3 py-2.5 text-white outline-none focus:border-cyan-100/45" /></label>
          <DurationInput label="Hours" value={hours} max={99} onChange={setHours} />
          <DurationInput label="Minutes" value={minutes} max={59} onChange={setMinutes} />
          <DurationInput label="Seconds" value={seconds} max={59} onChange={setSeconds} />
          <button type="button" disabled={customDuration <= 0} onClick={() => addTimer(customDuration, label)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-100 px-5 py-2.5 font-semibold text-slate-950 transition enabled:hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-cyan-200">
            <Plus size={17} /> Create
          </button>
        </div>
        <div className="mt-6 flex flex-wrap gap-2 border-t border-white/8 pt-5" aria-label="Timer presets">
          {clock.data.timerPresets.map((preset) => (
            <button key={preset.id} type="button" onClick={() => addTimer(preset.durationMs, preset.label, true)} className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white/58 transition hover:border-cyan-100/25 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-200">
              Start {preset.label}
            </button>
          ))}
        </div>
      </div>

      {clock.data.timers.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-white/14 bg-white/[0.035] px-6 py-16 text-center">
          <Timer className="mx-auto text-cyan-100/45" size={34} />
          <h3 className="mt-5 text-xl font-medium">No active timers</h3>
          <p className="mt-2 text-sm text-white/45">Create one above or use a quick preset.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {clock.data.timers.map((timer) => {
            const remaining = getTimerRemaining(timer, now ?? 0);
            const progress = timer.durationMs > 0 ? Math.min(1, Math.max(0, 1 - remaining / timer.durationMs)) : 0;
            return (
              <article key={timer.id} className={`rounded-[1.6rem] border p-5 backdrop-blur-xl ${timer.status === "complete" ? "border-emerald-200/25 bg-emerald-200/[0.07]" : "border-white/10 bg-white/[0.05]"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">{timer.status === "complete" ? "Complete" : timer.status}</p>
                    <h3 className="mt-2 text-lg font-medium">{timer.label}</h3>
                  </div>
                  <button type="button" aria-label={`Cancel ${timer.label}`} onClick={() => clock.removeTimer(timer.id)} className="rounded-xl p-2 text-white/35 transition hover:bg-red-300/10 hover:text-red-100 focus-visible:outline-2 focus-visible:outline-cyan-200"><Trash2 size={17} /></button>
                </div>
                <p className="mt-7 text-5xl font-extralight tabular-nums tracking-[-0.05em]">{formatDuration(remaining)}</p>
                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-cyan-100/70 transition-[width] duration-300" style={{ width: `${progress * 100}%` }} /></div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {timer.status === "running" ? (
                    <TimerButton label="Pause" icon={<Pause size={16} />} onClick={() => clock.pauseTimer(timer.id)} />
                  ) : (
                    <TimerButton label={timer.status === "paused" ? "Resume" : "Start"} icon={<Play size={16} />} onClick={() => clock.startTimer(timer.id)} />
                  )}
                  <TimerButton label="Reset" icon={<RotateCcw size={16} />} onClick={() => clock.resetTimer(timer.id)} secondary />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function DurationInput({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (value: number) => void }) {
  return <label className="text-sm font-medium text-white/60">{label}<input type="number" min={0} max={max} value={value} onChange={(event) => onChange(Math.min(max, Math.max(0, Number(event.target.value))))} className="mt-2 w-full rounded-xl border border-white/12 bg-black/25 px-3 py-2.5 text-white outline-none focus:border-cyan-100/45" /></label>;
}

function TimerButton({ label, icon, onClick, secondary = false }: { label: string; icon: React.ReactNode; onClick: () => void; secondary?: boolean }) {
  return <button type="button" onClick={onClick} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-cyan-200 ${secondary ? "border border-white/10 bg-white/5 text-white/60 hover:text-white" : "bg-cyan-100 text-slate-950 hover:bg-white"}`}>{icon}{label}</button>;
}
