"use client";

import { useDisplay } from "@/components/os/display";

import { HERO_LAYOUTS } from "./heroLayouts";

function getGreeting(hour: number) {
  if (hour >= 5 && hour < 12) {
    return "Good Morning";
  }

  if (hour >= 12 && hour < 17) {
    return "Good Afternoon";
  }

  if (hour >= 17 && hour < 22) {
    return "Good Evening";
  }

  return "Good Night";
}

export default function HeroGreeting() {
  const { profile } = useDisplay();

  const hero = HERO_LAYOUTS[profile];

  const now = new Date();

  const greeting = getGreeting(now.getHours());

  const formattedDate = now.toLocaleDateString(
    undefined,
    {
      weekday: "long",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <div
      className="space-y-4"
      style={{
        minWidth: 0,
      }}
    >
      <p className="text-sm uppercase tracking-[0.35em] text-white/55">
        COSMIC
      </p>

      <div className="space-y-2">
        <p className="text-white/60">
          <span
            style={{
              fontSize:
                hero.typography.details,
            }}
          >
            {formattedDate}
          </span>
        </p>

        <h1
          className="font-bold tracking-tight"
          style={{
            fontSize:
              hero.typography.greeting,
            lineHeight: 1,
          }}
        >
          {greeting}
        </h1>
      </div>

      <p
        className="max-w-2xl leading-relaxed text-white/70"
        style={{
          fontSize:
            hero.typography.weather,
        }}
      >
        Everything is ready. Weather,
        school, sports, garage,
        projects, and your assistant are
        all one glance away.
      </p>
    </div>
  );
}