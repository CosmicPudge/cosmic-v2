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
          error={error}
          kiosk={presentation === "kiosk"}
        />
      </WidgetFooter>
    </Widget>
  );
}
