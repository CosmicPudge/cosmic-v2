"use client";

import { BellRing } from "lucide-react";

import type { Alarm } from "@/core/contracts/Clock";
import { formatClockTime } from "@/services/clock/time";

interface ClockAlarmOverlayProps {
  alarm: Alarm;
  now: number;
  onDismiss: () => void;
  onSnooze: () => void;
}

export default function ClockAlarmOverlay({
  alarm,
  now,
  onDismiss,
  onSnooze,
}: ClockAlarmOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#030511]/82 p-5 backdrop-blur-2xl"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="active-alarm-title"
    >
      <div className="w-full max-w-xl rounded-[2rem] border border-cyan-100/20 bg-slate-950/75 p-8 text-center shadow-[0_32px_100px_rgba(0,0,0,0.65)] sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-100/20 bg-cyan-200/10 text-cyan-100">
          <BellRing aria-hidden="true" size={30} />
        </div>
        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.38em] text-cyan-100/55">
          Alarm
        </p>
        <h2 id="active-alarm-title" className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
          {alarm.label || "Alarm"}
        </h2>
        <p className="mt-6 text-5xl font-extralight tabular-nums tracking-[-0.05em] sm:text-7xl">
          {formatClockTime(now, "system", { seconds: true })}
        </p>
        <p className="mx-auto mt-7 max-w-md text-sm leading-6 text-white/55">
          Web alarms work while Cosmic is active. Browser suspension, device sleep, or closing the browser can delay an alarm.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          {alarm.snoozeEnabled && (
            <button
              type="button"
              onClick={onSnooze}
              className="rounded-2xl border border-white/15 bg-white/8 px-7 py-3 font-medium text-white transition hover:bg-white/14 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
            >
              Snooze 9 minutes
            </button>
          )}
          <button
            type="button"
            autoFocus
            onClick={onDismiss}
            className="rounded-2xl bg-cyan-100 px-8 py-3 font-semibold text-slate-950 transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
