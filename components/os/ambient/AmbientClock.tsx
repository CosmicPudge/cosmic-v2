"use client";

import useClock from "@/hooks/os/useClock";
import { formatAmbientDate, formatClockTime } from "@/services/clock/time";

export default function AmbientClock() {
  const now = useClock();

  return (
    <div className="flex flex-col justify-end">
      <p className="text-xs uppercase tracking-[0.36em] text-cyan-100/50">
        Local time
      </p>
      <h1 className="mt-4 text-[clamp(4.8rem,14vw,13rem)] font-extralight leading-[0.78] tracking-[-0.075em] text-white">
        {now ? formatClockTime(now, "system") : "--:--"}
      </h1>
      <p className="mt-7 text-[clamp(1.2rem,2.2vw,2.2rem)] font-light text-white/58">
        {now ? formatAmbientDate(now) : "Synchronizing date"}
      </p>
    </div>
  );
}
