"use client";

import { useEffect, useState } from "react";

import { useDisplay } from "@/components/os/display";

import { HERO_LAYOUTS } from "./heroLayouts";

export default function HeroClock() {
  const { profile } = useDisplay();

  const hero = HERO_LAYOUTS[profile];

  const [mounted, setMounted] =
    useState(false);

  const [now, setNow] =
    useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);

    const update = () => {
      setNow(new Date());
    };

    update();

    const interval =
      window.setInterval(update, 1000);

    return () =>
      window.clearInterval(interval);
  }, []);

  const clockStyle = {
    fontSize: hero.typography.clock,
    lineHeight: 1,
  };

  const secondsStyle = {
    fontSize: hero.typography.seconds,
    lineHeight: 1,
  };

  if (!mounted || !now) {
    return (
      <div
        className="text-right"
        style={{
          minWidth: 0,
        }}
      >
        <div
          className="font-bold tracking-tight"
          style={clockStyle}
        >
          --:--
        </div>

        <div
          className="font-medium text-white/60"
          style={secondsStyle}
        >
          :--
        </div>
      </div>
    );
  }

  const time = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const seconds = now
    .getSeconds()
    .toString()
    .padStart(2, "0");

  return (
    <div
      className="text-right"
      style={{
        minWidth: 0,
      }}
    >
      <div
        className="font-bold tracking-tight"
        style={clockStyle}
      >
        {time}
      </div>

      <div
        className="font-medium text-white/60"
        style={secondsStyle}
      >
        :{seconds}
      </div>
    </div>
  );
}