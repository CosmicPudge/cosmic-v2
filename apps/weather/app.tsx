import { defineApp } from "@/apps/core";

import Weather from "./Weather";

export const weatherApp = defineApp({
  id: "weather",

  title: "Weather",

  description: "Current conditions and forecasts.",

  accent: "weather",

  route: "/weather",

  icon: null,

  widget: Weather,

  window: Weather,

  fullscreen: Weather,
});