import type { WeatherData } from "@/engines/environment";

export type WeatherSceneId =
  | "clear-day"
  | "clear-night"
  | "partly-cloudy-day"
  | "partly-cloudy-night"
  | "cloudy"
  | "rain"
  | "heavy-rain"
  | "thunderstorm"
  | "snow"
  | "fog"
  | "fallback";

export interface WeatherScene {
  id: WeatherSceneId;
  src?: string;
  fallbackSrcs: string[];
  objectPosition: string;
}

const sceneNames = new Set<WeatherSceneId>([
  "clear-day", "clear-night", "partly-cloudy-day", "partly-cloudy-night",
  "cloudy", "rain", "heavy-rain", "thunderstorm", "snow", "fog", "fallback",
]);

function isSceneId(value: string | null | undefined): value is WeatherSceneId {
  return value !== null && value !== undefined && sceneNames.has(value as WeatherSceneId);
}

function isDaytime(weather: WeatherData | null) {
  const explicit = (weather as (WeatherData & { isDay?: boolean }) | null)?.isDay;
  if (typeof explicit === "boolean") return explicit;

  const now = Math.floor(Date.now() / 1000);
  if (weather?.sunrise && weather.sunset) return now >= weather.sunrise && now < weather.sunset;
  if (typeof weather?.daylightProgress === "number") return weather.daylightProgress > 0 && weather.daylightProgress < 100;

  const hour = new Date().getHours();
  return hour >= 6 && hour < 20;
}

function conditionId(weather: WeatherData | null): WeatherSceneId {
  const value = `${weather?.condition ?? ""} ${weather?.description ?? ""} ${weather?.icon ?? ""}`.toLowerCase();
  if (!value.trim()) return "fallback";
  if (value.includes("thunder") || value.includes("lightning")) return "thunderstorm";
  if (value.includes("snow") || value.includes("sleet") || value.includes("ice") || value.includes("blizzard")) return "snow";
  if (value.includes("heavy rain") || value.includes("torrential") || value.includes("downpour")) return "heavy-rain";
  if (value.includes("rain") || value.includes("drizzle") || value.includes("shower")) return "rain";
  if (value.includes("fog") || value.includes("mist") || value.includes("haze")) return "fog";
  if (value.includes("partly") || value.includes("mostly cloudy")) return isDaytime(weather) ? "partly-cloudy-day" : "partly-cloudy-night";
  if (value.includes("cloud") || value.includes("overcast")) return "cloudy";
  if (value.includes("clear") || value.includes("sunny")) return isDaytime(weather) ? "clear-day" : "clear-night";
  return "fallback";
}

export function resolveWeatherKioskScene(weather: WeatherData | null, developmentOverride?: string | null): WeatherScene {
  const id = process.env.NODE_ENV !== "production" && isSceneId(developmentOverride)
    ? developmentOverride
    : conditionId(weather);
  const imageId = id === "fallback" ? undefined : id;
  const base = imageId ? `/kiosk/scenes/weather/weather-${imageId}.png` : undefined;
  const fallbackIds = imageId === "heavy-rain" || imageId === "thunderstorm"
    ? ["rain"]
    : imageId === "partly-cloudy-night" || imageId === "partly-cloudy-day" || imageId === "fog"
      ? ["cloudy"]
      : [];

  return {
    id,
    src: base,
    fallbackSrcs: fallbackIds.map((fallbackId) => `/kiosk/scenes/weather/weather-${fallbackId}.png`),
    objectPosition: id.includes("night") ? "center 42%" : id === "fog" ? "center 55%" : "center center",
  };
}
