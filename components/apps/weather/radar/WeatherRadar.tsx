"use client";

import SectionCard from "@/components/os/ui/SectionCard";
import RadarMap from "./RadarMap";
import RadarTimeline from "./RadarTimeline";
import RadarControls from "./RadarControls";

interface Props {
  lat: number;
  lon: number;
}

export default function WeatherRadar({
  lat,
  lon,
}: Props) {
  return (
    <SectionCard title="Live Radar">
      <div className="space-y-4">
        <RadarMap lat={lat} lon={lon} />

        <RadarTimeline />

        <RadarControls />
      </div>
    </SectionCard>
  );
}