"use client";

import { useEffect, useState } from "react";
import { formatAmbientDate, formatClockTime } from "@/services/clock/time";

export default function LiveClock({ className = "", showDate = true }: { className?: string; showDate?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <time className={className} dateTime={now?.toISOString()} suppressHydrationWarning>
      <span className="tabular-nums">{now ? formatClockTime(now, "system") : "--:--"}</span>
      {showDate && <span className="ml-2 text-white/45">{now ? formatAmbientDate(now) : "Synchronizing"}</span>}
    </time>
  );
}
