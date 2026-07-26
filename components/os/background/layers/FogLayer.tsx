"use client";

import type { WeatherData } from "@/engines/environment";

interface Props {
  weather: WeatherData | null;
}

export default function AtmosphereLayer({ weather }: Props) {
  void weather;

  return null;
}