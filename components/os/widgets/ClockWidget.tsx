"use client";

import { useEffect, useState } from "react";

import GlassPanel from "../ui/GlassPanel";

export default function ClockWidget() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const time = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const weekday = now.toLocaleDateString([], {
    weekday: "long",
  });

  const date = now.toLocaleDateString([], {
    month: "long",
    day: "numeric",
  });

  const hour = now.getHours();

  const greeting =
    hour < 12
      ? "Good Morning"
      : hour < 18
      ? "Good Afternoon"
      : "Good Evening";

  return (
    <GlassPanel className="flex h-full flex-col items-center justify-center text-center">
      <p className="text-6xl font-black tracking-tight">
        {time}
      </p>

      <p className="mt-3 text-lg text-white/70">
        {weekday}
      </p>

      <p className="text-white/50">
        {date}
      </p>

      <p className="mt-5 text-white/35 uppercase tracking-[0.3em] text-xs">
        {greeting}
      </p>
    </GlassPanel>
  );
}