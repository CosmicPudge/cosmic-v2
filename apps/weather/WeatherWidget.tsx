"use client";

import type { CosmicAppProps } from "@/apps/core";

import Weather from "./Weather";

export default function WeatherWidget(
  props: CosmicAppProps
) {
  return <Weather {...props} />;
}