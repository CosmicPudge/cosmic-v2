"use client";

import useWeather from "@/hooks/os/useWeather";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";
import { useWidgetContext } from "@/components/os/ui/widget/WidgetContext";
import { useDashboardWidgetReadiness } from "@/components/dashboard/readiness/DashboardReadiness";

import WeatherCurrent from "./WeatherCurrent";
import WeatherHourly from "./WeatherHourly";
import WeatherStats from "./WeatherStats";
import WeatherFooter from "./WeatherFooter";

function weatherSceneState(condition: string | undefined, daylightProgress: number | undefined) {
  const value = condition?.toLowerCase() ?? "unknown";
  const category = value.includes("thunder") ? "thunder" : value.includes("snow") || value.includes("sleet") || value.includes("ice") ? "snow" : value.includes("rain") || value.includes("drizzle") || value.includes("shower") ? "rain" : value.includes("cloud") || value.includes("overcast") || value.includes("fog") || value.includes("mist") ? "cloudy" : value === "unknown" ? "unknown" : "clear";
  const day = daylightProgress !== undefined && daylightProgress > 0 && daylightProgress < 100;
  return `${category}-${day ? "day" : "night"}`;
}

export default function WeatherWidget() {
  const { size, presentation } = useWidgetContext();
  const {
    weather,
    loading,
    error,
  } = useWeather();
  useDashboardWidgetReadiness("weather", loading ? "loading" : error && !weather ? "degraded" : "ready");

  return (
    <Widget
      accent="weather"
      sceneState={weatherSceneState(weather?.condition, weather?.daylightProgress)}
    >
      <WidgetHeader
        title="Weather"
        subtitle={weather?.city}
      />

      <WidgetBody scrollable={size === "large"}>
  <WeatherCurrent
    weather={weather}
    loading={loading}
  />

  {size !== "small" && <WeatherStats weather={weather} loading={loading} />}

  {size === "large" && <WeatherHourly weather={weather} loading={loading} />}
</WidgetBody>
      <WidgetFooter>
        <WeatherFooter
          weather={weather}
          loading={loading}
          error={error}
          kiosk={presentation === "kiosk"}
        />
      </WidgetFooter>
    </Widget>
  );
}
