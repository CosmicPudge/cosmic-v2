"use client";

import { useEffect, useState } from "react";

export default function HeroClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const time = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const seconds = now
    .getSeconds()
    .toString()
    .padStart(2, "0");

  return (
    <div className="space-y-1 text-right">
      <div className="text-6xl font-bold tracking-tight">
        {time}
      </div>

      <div className="text-xl font-medium text-white/60">
        :{seconds}
      </div>
    </div>
  );
}