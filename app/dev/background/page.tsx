"use client";

import { useState } from "react";

import CosmicBackground from "@/components/os/background/CosmicBackground";
import type {
  CosmicBackgroundIntensity,
  CosmicBackgroundMotion,
  CosmicBackgroundVariant,
} from "@/components/os/background/CanvasRenderer";

const TIME_PRESETS = [0, 3, 6, 9, 12, 15, 18, 21] as const;
const INTENSITIES: CosmicBackgroundIntensity[] = ["low", "normal", "high"];
const MOTION_LEVELS: CosmicBackgroundMotion[] = ["off", "subtle", "normal"];

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function SegmentedButton<T extends string>({
  value,
  selected,
  onSelect,
}: {
  value: T;
  selected: boolean;
  onSelect: (value: T) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`rounded-full px-3 py-1.5 text-xs capitalize transition ${
        selected
          ? "bg-cyan-200 text-slate-950"
          : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
      }`}
    >
      {value}
    </button>
  );
}

export default function BackgroundPreviewPage() {
  const [minutes, setMinutes] = useState(12 * 60);
  const [variant, setVariant] = useState<CosmicBackgroundVariant>("dashboard");
  const [intensity, setIntensity] = useState<CosmicBackgroundIntensity>("normal");
  const [motion, setMotion] = useState<CosmicBackgroundMotion>("normal");
  const [debug, setDebug] = useState(false);

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-black text-white">
      <CosmicBackground
        variant={variant}
        intensity={intensity}
        motion={motion}
        timeOverrideSeconds={minutes * 60}
        debug={debug}
      />

      <div className="relative z-10 flex min-h-[100svh] flex-col justify-between gap-8 p-[max(1.25rem,env(safe-area-inset-top))] sm:p-8">
        <header>
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-100/55">
            Developer lab
          </p>
          <h1 className="mt-2 text-3xl font-light tracking-tight sm:text-5xl">
            Celestial background
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">
            One deterministic sky, sampled at any point in its 24-hour orbit.
          </p>
        </header>

        <section className="w-full max-w-4xl self-center rounded-[1.75rem] border border-white/10 bg-[#060916]/80 p-4 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/40">
                Local sky time
              </p>
              <p className="mt-1 font-mono text-3xl font-light text-cyan-50">
                {formatMinutes(minutes)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setDebug((current) => !current)}
              className={`rounded-full border px-4 py-2 text-xs transition ${
                debug
                  ? "border-cyan-200/60 bg-cyan-200/15 text-cyan-50"
                  : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              Orbit debug {debug ? "on" : "off"}
            </button>
          </div>

          <input
            aria-label="Time of day"
            className="mt-5 w-full accent-cyan-200"
            type="range"
            min={0}
            max={1_439}
            step={1}
            value={minutes}
            onChange={(event) => setMinutes(Number(event.target.value))}
          />

          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
            {TIME_PRESETS.map((hour) => (
              <button
                key={hour}
                type="button"
                onClick={() => setMinutes(hour * 60)}
                className="rounded-xl border border-white/8 bg-white/[0.04] px-2 py-2 font-mono text-xs text-white/55 transition hover:border-cyan-100/30 hover:text-white"
              >
                {String(hour).padStart(2, "0")}:00
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-5 border-t border-white/8 pt-5 md:grid-cols-3">
            <fieldset>
              <legend className="mb-2 text-[0.68rem] uppercase tracking-[0.22em] text-white/35">
                Variant
              </legend>
              <div className="flex gap-2">
                {(["dashboard", "ambient"] as const).map((value) => (
                  <SegmentedButton
                    key={value}
                    value={value}
                    selected={variant === value}
                    onSelect={setVariant}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-[0.68rem] uppercase tracking-[0.22em] text-white/35">
                Intensity
              </legend>
              <div className="flex gap-2">
                {INTENSITIES.map((value) => (
                  <SegmentedButton
                    key={value}
                    value={value}
                    selected={intensity === value}
                    onSelect={setIntensity}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-[0.68rem] uppercase tracking-[0.22em] text-white/35">
                Motion
              </legend>
              <div className="flex gap-2">
                {MOTION_LEVELS.map((value) => (
                  <SegmentedButton
                    key={value}
                    value={value}
                    selected={motion === value}
                    onSelect={setMotion}
                  />
                ))}
              </div>
            </fieldset>
          </div>
        </section>
      </div>
    </main>
  );
}
