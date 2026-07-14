"use client";

import { useEffect, useState } from "react";

function formatTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(date: Date) {
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function AmbientClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full flex-col justify-center">

      <h1 className="text-8xl font-extralight leading-none">
        {formatTime(now)}
      </h1>

      <p className="mt-4 text-3xl text-white/60">
        {formatDate(now)}
      </p>

    </div>
  );
}