"use client";

import type { CosmicAppProps } from "@/apps/core";

import Weather from "./Weather";

export default function WeatherFullscreen(
  props: CosmicAppProps
) {
  return <Weather {...props} />;
}