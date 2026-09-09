"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

interface Props {
  children: React.ReactNode;
}

const KioskAmbientContext = createContext<{ setPersistentClockHidden: (_hidden: boolean) => void }>({ setPersistentClockHidden: () => undefined });

export function useKioskAmbientFrame() {
  return useContext(KioskAmbientContext);
}

function simulatedHour(value: string | null) {
  if (process.env.NODE_ENV === "production" || value === null || !/^\d{1,2}$/.test(value)) return null;
  const hour = Number(value);
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : null;
}

export default function KioskAmbientFrame({ children }: Props) {
  const searchParams = useSearchParams();
  const [now, setNow] = useState<Date | null>(null);
  const setPersistentClockHidden = useCallback(() => undefined, []);
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
    <KioskAmbientContext.Provider value={{ setPersistentClockHidden }}>
      <div className="kiosk-ambient-frame fixed inset-0 h-[100dvh] w-[100dvw] overflow-hidden">
        {children}
      <div className={`kiosk-night-dimmer pointer-events-none absolute inset-0 z-40 transition-opacity duration-[1500ms] motion-reduce:transition-none ${night ? "opacity-100" : "opacity-0"}`} aria-hidden="true" />
      </div>
    </KioskAmbientContext.Provider>
  );
}
