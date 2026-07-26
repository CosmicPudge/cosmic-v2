"use client";

import { useMemo } from "react";

function getGreeting(hour: number) {
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 22) return "Good Evening";

  return "Good Night";
}

export default function HeroGreeting() {
  const now = new Date();

  const greeting = useMemo(
    () => getGreeting(now.getHours()),
    [now]
  );

  const formattedDate = useMemo(() => {
    return now.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, [now]);

  return (
    <div className="space-y-4">
      <p className="text-sm uppercase tracking-[0.35em] text-white/55">
        COSMIC
      </p>

      <div className="space-y-2">
        <p className="text-white/60 text-lg">
          {formattedDate}
        </p>

        <h1 className="text-6xl font-bold tracking-tight">
          {greeting}
        </h1>
      </div>

      <p className="max-w-2xl text-lg leading-relaxed text-white/70">
        Everything is ready. Weather, school, sports, garage,
        projects, and your assistant are all one glance away.
      </p>
    </div>
  );
}