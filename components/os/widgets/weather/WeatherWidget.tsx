"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import useLocation from "@/hooks/os/useLocation";
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
  // Use the same live weather provider as the shared kiosk header even when
  // the separately authenticated kiosk aggregate is unavailable.
  const directWeatherEnabled = true;

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
  // Provider entries may start hours ahead (for example 7 PM at 1 PM).
  // Never relabel a future forecast entry as current conditions.

  const coords = useLocation();
  const [liveHourly, setLiveHourly] = useState<Array<{time:string;temp:number;icon:string}> | null>(null);
  useEffect(() => {
    if (!coords) return;
    let active = true;
    const fetchHourly = async () => {
      try {
        const params = new URLSearchParams({
          latitude:String(coords.lat),longitude:String(coords.lon),
          hourly:"temperature_2m,weather_code",temperature_unit:"fahrenheit",
          timezone:"auto",forecast_days:"2"
        });
        const response = await fetch("https://api.open-meteo.com/v1/forecast?" + params.toString());
        if (!response.ok) throw new Error("Hourly provider unavailable");
        const data = await response.json() as {utc_offset_seconds?:number;hourly?:{time?:string[];temperature_2m?:number[];weather_code?:number[]}};
        const offset = data.utc_offset_seconds ?? 0;
        const times = data.hourly?.time ?? [];
        const temperatures = data.hourly?.temperature_2m ?? [];
        const codes = data.hourly?.weather_code ?? [];
        const upcoming = times.map((time,i) => ({
          instant:Date.parse(time + "Z") - offset*1000,
          temp:temperatures[i], code:codes[i]
        })).filter(item => Number.isFinite(item.instant) && item.instant > Date.now() && Number.isFinite(item.temp))
          .slice(0,5).map(item => ({
            time:new Intl.DateTimeFormat("en-US",{hour:"numeric",timeZone:"UTC"}).format(new Date(item.instant+offset*1000)),
            temp:item.temp,icon:hourlyWeatherIcon(item.code)
          }));
        if (active) setLiveHourly(upcoming);
      } catch { if (active) setLiveHourly(null); }
    };
    void fetchHourly();
    const interval = window.setInterval(() => void fetchHourly(), 600_000);
    return () => {active=false;window.clearInterval(interval);};
  }, [coords?.lat,coords?.lon]);
  const forecast = liveHourly
    ? [...(weather ? [{time:"Now",temp:weather.temp,icon:"03d"}] : []), ...liveHourly].slice(0,6)
    : (weather?.hourlyForecast ?? []).slice(0,6);

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
                  <p>{hour.time}</p>
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

function hourlyWeatherIcon(code:number) {
  if (code===0) return "01d";
  if (code===1) return "02d";
  if (code===2) return "03d";
  if (code===3) return "04d";
  if ([45,48].includes(code)) return "50d";
  if ([51,53,55,56,57].includes(code)) return "09d";
  if ([61,63,65,66,67,80,81,82].includes(code)) return "10d";
  if ([71,73,75,77,85,86].includes(code)) return "13d";
  if ([95,96,99].includes(code)) return "11d";
  return "03d";
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
