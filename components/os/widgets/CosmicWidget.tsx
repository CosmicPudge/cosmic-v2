"use client";

import GlassPanel from "../ui/GlassPanel";
import Button from "../ui/Button";

import useWeather from "@/hooks/os/useWeather";

export default function AssistantWidget() {
  const { weather } = useWeather();

  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good Morning"
      : hour < 18
      ? "Good Afternoon"
      : "Good Evening";

  const summary = [];

  if (weather) {
    summary.push(
      `${weather.temp}° • ${weather.description}`
    );
  }

  summary.push("No events today");
  summary.push("No new notifications");

  return (
    <GlassPanel className="flex h-full flex-col justify-between p-6">

      <div>

        <p className="text-xs uppercase tracking-[0.3em] text-white/50">
          Cosmic
        </p>

        <h2 className="mt-3 text-3xl font-bold">
          {greeting} 👋
        </h2>

        <p className="mt-2 text-white/50">
          Here's what's happening.
        </p>

        <div className="mt-6 space-y-3">

          {summary.map((item) => (
            <div
              key={item}
              className="text-white/75"
            >
              • {item}
            </div>
          ))}

        </div>

      </div>

      <Button
        variant="secondary"
        fullWidth
      >
        Ask Cosmic
      </Button>

    </GlassPanel>
  );
}