"use client";

import { Flag, Gauge, Pause, Play, RotateCcw } from "lucide-react";

import { useClockTick } from "@/hooks/os/useClock";
import { formatDuration, getStopwatchElapsed } from "@/services/clock/time";
import { useClockData } from "./ClockProvider";

export default function StopwatchPanel() {
  const clock = useClockData();
  const running = clock.data.stopwatch.status === "running";
  const now = useClockTick(running ? 100 : 1_000);
  const elapsed = getStopwatchElapsed(clock.data.stopwatch, now ?? 0);

  return (
    <section aria-labelledby="stopwatch-heading" className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-100/45">Timestamp precision</p>
        <h2 id="stopwatch-heading" className="mt-2 text-3xl font-semibold tracking-tight">Stopwatch</h2>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-white/11 bg-white/[0.05] p-6 text-center backdrop-blur-2xl sm:p-10">
        <Gauge className="mx-auto text-cyan-100/45" size={28} />
        <p className="mt-8 text-[clamp(4rem,12vw,9rem)] font-extralight leading-none tabular-nums tracking-[-0.07em]">
          {formatDuration(elapsed, true)}
        </p>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.3em] text-white/38">{clock.data.stopwatch.status}</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          {running ? (
            <ControlButton label="Pause" icon={<Pause size={17} />} onClick={() => clock.pauseStopwatch()} primary />
          ) : (
            <ControlButton label={clock.data.stopwatch.status === "paused" ? "Resume" : "Start"} icon={<Play size={17} />} onClick={() => clock.startStopwatch()} primary />
          )}
          <ControlButton label="Lap" icon={<Flag size={17} />} onClick={() => clock.lapStopwatch()} disabled={!running} />
          <ControlButton label="Reset" icon={<RotateCcw size={17} />} onClick={() => clock.resetStopwatch()} disabled={elapsed === 0 && clock.data.stopwatch.laps.length === 0} />
        </div>
      </div>

      {clock.data.stopwatch.laps.length === 0 ? (
        <div className="rounded-[1.6rem] border border-dashed border-white/12 px-6 py-10 text-center text-sm text-white/42">No laps recorded.</div>
      ) : (
        <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/18 backdrop-blur-xl">
          <div className="grid grid-cols-3 border-b border-white/8 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/35"><span>Lap</span><span className="text-right">Split</span><span className="text-right">Total</span></div>
          <ol className="max-h-80 overflow-y-auto">
            {[...clock.data.stopwatch.laps].reverse().map((lap, index, reversed) => (
              <li key={lap.id} className="grid grid-cols-3 border-b border-white/6 px-5 py-3 text-sm last:border-0">
                <span className="text-white/55">Lap {reversed.length - index}</span>
                <span className="text-right font-mono tabular-nums">{formatDuration(lap.lapDurationMs, true)}</span>
                <span className="text-right font-mono tabular-nums text-white/55">{formatDuration(lap.totalElapsedMs, true)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

function ControlButton({ label, icon, onClick, primary = false, disabled = false }: { label: string; icon: React.ReactNode; onClick: () => void; primary?: boolean; disabled?: boolean }) {
  return <button type="button" disabled={disabled} onClick={onClick} className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-cyan-200 disabled:cursor-not-allowed disabled:opacity-35 ${primary ? "bg-cyan-100 text-slate-950 hover:bg-white" : "border border-white/12 bg-white/6 text-white/65 hover:text-white"}`}>{icon}{label}</button>;
}
