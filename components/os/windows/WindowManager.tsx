"use client";

import { useOS } from "../core/OSProvider";

import WeatherWindow from "./WeatherWindow";

export default function WindowManager() {
  const { openWindows } = useOS();

  return (
    <>
      {openWindows.includes("weather") && (
        <WeatherWindow />
      )}
    </>
  );
}