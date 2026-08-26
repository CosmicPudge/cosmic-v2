"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

interface Props {
  children: React.ReactNode;
}

function simulatedHour(value: string | null) {
  if (process.env.NODE_ENV === "production" || value === null || !/^\d{1,2}$/.test(value)) return null;
  const hour = Number(value);
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : null;
}

function KioskClock({ now }: { now: Date | null }) {
  return (
    <div className="kiosk-clock rounded-full border border-white/10 bg-black/25 px-3 py-1 text-center text-[clamp(.7rem,1.1vw,.95rem)] font-medium tabular-nums tracking-[.12em] text-white/75 backdrop-blur-sm" aria-label="Current local time">
      {now ? now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "--:--"}
    </div>
  );
}

export default function KioskAmbientFrame({ children }: Props) {
  const searchParams = useSearchParams();
  const [now, setNow] = useState<Date | null>(null);
  const overrideHour = simulatedHour(searchParams.get("simulate-kiosk-hour"));

  useEffect(() => {
    let timer: number | undefined;
    const update = () => {
      setNow(new Date());
      timer = window.setTimeout(update, 60_000 - (Date.now() % 60_000) + 50);
    };
    timer = window.setTimeout(update, 0);
    return () => { if (timer !== undefined) window.clearTimeout(timer); };
  }, []);

  const night = useMemo(() => {
    const hour = overrideHour ?? now?.getHours();
    return hour !== undefined && (hour >= 20 || hour < 6);
  }, [now, overrideHour]);

  return (
    <div className="kiosk-ambient-frame relative h-[100svh] w-full overflow-hidden">
      {children}
      <div className={`kiosk-night-dimmer pointer-events-none absolute inset-0 z-40 transition-opacity duration-[1500ms] motion-reduce:transition-none ${night ? "opacity-100" : "opacity-0"}`} aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 top-2 z-50 flex justify-center">
        <KioskClock now={now} />
      </div>
    </div>
  );
}
