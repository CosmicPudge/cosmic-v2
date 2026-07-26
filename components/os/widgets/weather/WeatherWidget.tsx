"use client";

import useWeather from "@/hooks/os/useWeather";

import Widget from "@/components/os/ui/widget/Widget";
import WidgetHeader from "@/components/os/ui/widget/WidgetHeader";
import WidgetBody from "@/components/os/ui/widget/WidgetBody";
import WidgetFooter from "@/components/os/ui/widget/WidgetFooter";

import WeatherCurrent from "./WeatherCurrent";
import WeatherHourly from "./WeatherHourly";
import WeatherStats from "./WeatherStats";
import WeatherFooter from "./WeatherFooter";

export default function WeatherWidget() {
  const {
    weather,
    loading,
    error,
  } = useWeather();

  return (
    <Widget
      accent="weather"
    >
      <WidgetHeader
        title="Weather"
        subtitle={weather?.city}
      />

      <WidgetBody>
  <WeatherCurrent
    weather={weather}
    loading={loading}
  />

  <WeatherStats
    weather={weather}
    loading={loading}
  />

  <WeatherHourly
    weather={weather}
    loading={loading}
  />
</WidgetBody>
      <WidgetFooter>
        <WeatherFooter
          weather={weather}
          error={error}
        />
      </WidgetFooter>
    </Widget>
  );
}