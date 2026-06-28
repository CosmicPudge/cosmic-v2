"use client";

import AppWindow from "./AppWindow";
import WeatherWidget from "../widgets/WeatherWidget";

export default function WeatherWindow() {
  return (
    <AppWindow
      title="Weather"
      windowName="weather"
    >
      <WeatherWidget />
    </AppWindow>
  );
}