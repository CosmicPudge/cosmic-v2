"use client";

import useWeather from "@/hooks/os/useWeather";
import type { WeatherData } from "@/engines/environment";

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
import WeatherIcon from "@/components/icons/weather/WeatherIcon";
import mapWeatherCondition from "@/components/icons/weather/mapWeatherCondition";
import { resolveWeatherKioskScene } from "./weatherScene";

export default function WeatherWidget() {
  const { size, presentation } = useWidgetContext();
  const {
    weather,
    loading,
    error,
  } = useWeather();
  useDashboardWidgetReadiness("weather", loading ? "loading" : error && !weather ? "degraded" : "ready");
  const developmentWeatherOverride = process.env.NODE_ENV !== "production" && presentation === "kiosk" && typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("simulate-weather")
    : null;
  const scene = resolveWeatherKioskScene(weather, developmentWeatherOverride);

  if (presentation === "kiosk") {
    return <KioskWeatherScene weather={weather} loading={loading} error={error} scene={scene} />;
  }

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
          loading={loading}
          error={error}
          kiosk={false}
        />
      </WidgetFooter>
    </Widget>
  );
}

function KioskWeatherScene({ weather, loading, error, scene }: { weather: WeatherData | null; loading: boolean; error: string | null; scene: ReturnType<typeof resolveWeatherKioskScene> }) {
  const isDay = scene.id.endsWith("day") || (weather !== null && weather.daylightProgress > 0 && weather.daylightProgress < 100);
  const forecast = weather?.hourlyForecast.slice(0, 5) ?? [];

  return (
    <Widget
      accent="weather"
      className="kiosk-weather-widget"
      contentPadding={false}
      sceneState={scene.id}
      sceneVariant={scene.id}
      imageUrl={scene.src}
      imageFallbackUrls={scene.fallbackSrcs}
      imagePosition={scene.objectPosition}
      imageOpacity={1}
      imageBlur={0}
    >
      <div className="kiosk-weather-scene relative flex h-full min-h-0 flex-col overflow-hidden px-6 pb-5 pt-7 text-white sm:px-12 sm:pb-8 sm:pt-10">
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-[clamp(.85rem,1.8vw,1.25rem)] font-semibold uppercase tracking-[.18em] text-white/90">{weather?.city ?? "Current conditions"}</p>
            <p className="mt-1 truncate text-[clamp(.68rem,1.25vw,.9rem)] uppercase tracking-[.24em] text-white/65">{weather?.condition ?? (loading ? "Loading conditions" : "Weather unavailable")}</p>
            {error && weather && <p className="mt-1 text-[.58rem] uppercase tracking-[.18em] text-amber-100/65">Updating when connection returns</p>}
          </div>
          {weather && <WeatherIcon condition={mapWeatherCondition(weather.condition)} isDay={isDay} size={56} />}
        </div>

        {weather ? (
          <div className="relative z-10 mt-5 flex min-h-0 flex-1 flex-col justify-center gap-5 sm:mt-2 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
            <div className="shrink-0">
              <p className="kiosk-weather-temperature tabular-nums font-extralight tracking-[-.08em]">{Math.round(weather.temp)}°</p>
              <p className="mt-1 text-[clamp(.72rem,1.35vw,1rem)] text-white/75">Feels like {Math.round(weather.feelsLike)}°</p>
              <p className="mt-2 text-[clamp(.68rem,1.2vw,.9rem)] uppercase tracking-[.16em] text-white/65">H {Math.round(weather.high)}° <span className="text-white/35">·</span> L {Math.round(weather.low)}°</p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:gap-x-10">
              <WeatherValue label="Humidity" value={`${weather.humidity}%`} />
              <WeatherValue label="Wind" value={`${Math.round(weather.windSpeed)} mph`} />
              <WeatherValue label="Precipitation" value={`${weather.precipitation24h} mm`} />
              <WeatherValue label="UV index" value={`${weather.uvIndex}`} />
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-1 items-center justify-center text-sm text-white/65">{loading ? "Cosmic is locating current conditions…" : "Weather temporarily unavailable"}</div>
        )}

        <div className="relative z-10 mt-4 border-t border-white/20 pt-3">
          {forecast.length > 0 ? (
            <div className="grid grid-cols-5 gap-1 sm:gap-3">
              {forecast.map((hour, index) => (
                <div key={`${hour.time}-${index}`} className="min-w-0 text-center">
                  <p className="truncate text-[.58rem] uppercase tracking-[.12em] text-white/55">{index === 0 ? "Now" : hour.time}</p>
                  <p className="mt-1 text-[clamp(.72rem,1.5vw,1rem)] font-semibold tabular-nums">{Math.round(hour.temp)}°</p>
                  <p className="mt-0.5 text-[.56rem] text-white/45">{hour.precipitationChance}%</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[.62rem] uppercase tracking-[.18em] text-white/45">{error ? "Retrying current conditions" : "Forecast will appear when available"}</p>
          )}
        </div>
      </div>
    </Widget>
  );
}

function WeatherValue({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[.58rem] uppercase tracking-[.2em] text-white/55">{label}</p><p className="mt-1 text-[clamp(.8rem,1.7vw,1.15rem)] font-medium tabular-nums text-white/90">{value}</p></div>;
}
