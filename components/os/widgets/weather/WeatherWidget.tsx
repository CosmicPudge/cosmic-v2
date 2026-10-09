"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";
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
import { useDeveloperKioskData } from "@/hooks/os/useDeveloperKioskData";
import { shouldLoadDashboardWidgetProvider } from "@/services/kiosk/widgetDataPolicy";
import { useClockTick } from "@/hooks/os/useClock";
import { TEMPORARY_KIOSK_LOCATION } from "@/services/kioskLocation";

export default function WeatherWidget() {
  const { size, presentation } = useWidgetContext();
  const directWeatherEnabled =
    presentation !== "kiosk" ||
    (typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname));

  const {
    weather,
    loading,
    error,
  } = useWeather({ enabled: directWeatherEnabled ? true : shouldLoadDashboardWidgetProvider(presentation) });

  const developer = useDeveloperKioskData();
  const kioskWeather = developer.data?.weather ?? weather;
  useDashboardWidgetReadiness("weather", loading ? "loading" : error && !weather ? "degraded" : "ready");
  const developmentWeatherOverride = process.env.NODE_ENV !== "production" && presentation === "kiosk" && typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("simulate-weather")
    : null;
  const scene = resolveWeatherKioskScene(kioskWeather, developmentWeatherOverride);

  if (presentation === "kiosk") {
    return <KioskWeatherScene
      weather={kioskWeather}
      loading={kioskWeather ? false : (developer.loading || loading)}
      error={kioskWeather ? null : (developer.error ?? error)}
      scene={scene}
      locationLabel={developer.data?.location?.label}
    />;
  }

  return (
    <Widget
      accent="weather"
      imageUrl={scene.src}
      imageFallbackUrls={scene.fallbackSrcs}
      imagePosition={scene.objectPosition}
      imageOpacity={.86}
      imageBlur={0}
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

function KioskWeatherScene({
  weather,
  loading,
  error,
  scene,
  locationLabel,
}: {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  scene: ReturnType<typeof resolveWeatherKioskScene>;
  locationLabel?: string;
}) {
  const now = useClockTick(30_000);
  const isDay = scene.id.endsWith("day") || (weather !== null && weather.daylightProgress > 0 && weather.daylightProgress < 100);
  const forecast = weather?.hourlyForecast.slice(0, 6) ?? [];
  const currentHour = now !== null ? new Date(now).getHours() : new Date().getHours();
  const location = locationLabel ?? (weather?.city && weather.city !== "Current location" ? weather.city : TEMPORARY_KIOSK_LOCATION.label);
  const background = scene.src ?? scene.fallbackSrcs[0] ?? "/kiosk/scenes/weather/weather-cloudy.png";
  const precipChance = weather?.hourlyForecast[0]?.precipitationChance ?? weather?.dailyForecast[0]?.precipitationChance ?? 0;

  return (
    <section className="cosmos-kiosk-weather" data-weather-scene={scene.id} aria-label="Cosmos weather">
      <Image
        className="cosmos-kiosk-weather-background"
        src={background}
        alt=""
        fill
        priority
        sizes="100vw"
        style={{ objectPosition: scene.objectPosition }}
      />
      <div className="cosmos-kiosk-weather-shade" aria-hidden="true" />

      <header className="cosmos-kiosk-weather-header">
        <div className="cosmos-kiosk-weather-brand">
          <strong>COSMOS</strong>
          <span aria-hidden="true">•</span>
          <span>WEATHER</span>
        </div>
        <div className="cosmos-kiosk-weather-now">
          <strong>{now ? new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(now) : "--:--"}</strong>
          <span aria-hidden="true">•</span>
          <span>{now ? new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(now) : "Synchronizing"}</span>
        </div>
      </header>

      {weather ? (
        <>
          <div className="cosmos-kiosk-weather-hero">
            <div className="cosmos-kiosk-weather-icon">
              <WeatherIcon condition={mapWeatherCondition(weather.condition)} isDay={isDay} size={112} />
            </div>
            <div>
              <p className="cosmos-kiosk-weather-temp">{Math.round(weather.temp)}°</p>
              <p className="cosmos-kiosk-weather-condition">{weather.condition}</p>
              <p className="cosmos-kiosk-weather-location"><MapPin size={19} strokeWidth={2.2} />{location}</p>
            </div>
          </div>

          <div className="cosmos-kiosk-weather-stats">
            <WeatherStat label="High / Low" value={`${Math.round(weather.high)}° / ${Math.round(weather.low)}°`} />
            <WeatherStat label="Feels Like" value={`${Math.round(weather.feelsLike)}°`} />
            <WeatherStat label="Humidity" value={`${weather.humidity}%`} />
            <WeatherStat label="Wind" value={`${Math.round(weather.windSpeed)} mph`} />
            <WeatherStat label="Precip Chance" value={`${precipChance}%`} />
            <WeatherStat label="Sunrise" value={formatSunTime(weather.sunrise)} />
            <WeatherStat label="Sunset" value={formatSunTime(weather.sunset)} />
          </div>

          <div className="cosmos-kiosk-weather-hourly">
            <p className="cosmos-kiosk-weather-section-label">NEXT 6 HOURS</p>
            <div className="cosmos-kiosk-weather-hourly-grid">
              {forecast.map((hour, index) => (
                <div className="cosmos-kiosk-weather-hour" key={`${hour.time}-${index}`}>
                  <p>{index === 0 ? "Now" : hour.time}</p>
                  <WeatherIcon
                    condition={mapWeatherCondition(hour.icon)}
                    isDay={hourIsDay(hour.icon, currentHour + index)}
                    size={38}
                  />
                  <strong>{Math.round(hour.temp)}°</strong>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="cosmos-kiosk-weather-unavailable">
          {loading ? "Loading current weather…" : error ? "Weather temporarily unavailable" : "Weather unavailable"}
        </div>
      )}
    </section>
  );
}

function hourIsDay(icon: string, hour: number) {
  if (icon.endsWith("n")) return false;
  if (icon.endsWith("d") && !["01d", "02d"].includes(icon)) return true;
  const normalizedHour = ((hour % 24) + 24) % 24;
  return normalizedHour >= 6 && normalizedHour < 20;
}

function WeatherStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="cosmos-kiosk-weather-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatSunTime(value: number) {
  if (!value) return "--";
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value * 1000));
}

function WeatherValue({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[.58rem] uppercase tracking-[.2em] text-white/55">{label}</p><p className="mt-1 text-[clamp(.8rem,1.7vw,1.15rem)] font-medium tabular-nums text-white/90">{value}</p></div>;
}
