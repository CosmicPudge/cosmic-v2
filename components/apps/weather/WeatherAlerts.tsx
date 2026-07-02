"use client";

import SectionCard from "@/components/os/ui/SectionCard";

export default function WeatherAlerts() {
  return (
    <SectionCard title="Weather Alerts">
      <div className="h-24 flex items-center justify-center text-white/50">
        No active alerts.
      </div>
    </SectionCard>
  );
}