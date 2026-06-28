"use client";

import WeatherWindow from "./WeatherWindow";
import { useWindowStore } from "@/stores/windowStore";

export default function WindowManager() {
  const weather = useWindowStore(
    (state) => state.windows.weather
  );

  return (
    <>
      {weather.open && <WeatherWindow />}
    </>
  );
}