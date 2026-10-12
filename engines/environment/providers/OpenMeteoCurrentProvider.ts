import type { CurrentWeather } from "../models/types";
import { weatherCodeToIcon } from "../utils/weatherCodeToIcon";
import { fetchWithTimeout } from "@/services/kiosk/fetchWithTimeout";

type OpenMeteoResponse = {
  timezone?: string;
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    precipitation?: number;
    weather_code?: number;
    is_day?: number;
  };
  daily?: {
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    sunrise?: string[];
    sunset?: string[];
  };
};

function weatherCondition(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Cloudy";
  if (code <= 48) return "Fog";
  if (code <= 67 || code === 80 || code === 81 || code === 82) return "Rain";
  if (code <= 77 || code === 85 || code === 86) return "Snow";
  if (code >= 95) return "Thunderstorm";
  return "Cloudy";
}

export async function getOpenMeteoCurrent(lat: number, lon: number): Promise<CurrentWeather> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(lat), longitude: String(lon),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation,weather_code,is_day",
    daily: "temperature_2m_max,temperature_2m_min,sunrise,sunset",
    temperature_unit: "fahrenheit", wind_speed_unit: "mph", timezone: "auto",
  }).toString();
  const response = await fetchWithTimeout(url, { redirect: "error", next: { revalidate: 60 } });
  if (!response.ok) throw new Error("Open-Meteo current weather request failed.");
  const data = await response.json() as OpenMeteoResponse;
  const current = data.current;
  const temp = current?.temperature_2m;
  if (typeof temp !== "number" || !Number.isFinite(temp) || typeof current?.weather_code !== "number") {
    throw new Error("Open-Meteo returned invalid current weather.");
  }
  const sunrise = data.daily?.sunrise?.[0] ? Math.floor(new Date(data.daily.sunrise[0]).getTime() / 1000) : 0;
  const sunset = data.daily?.sunset?.[0] ? Math.floor(new Date(data.daily.sunset[0]).getTime() / 1000) : 0;
  const daylightSeconds = Math.max(0, sunset - sunrise);
  const now = Math.floor(Date.now() / 1000);
  const daylightProgress = daylightSeconds ? Math.max(0, Math.min(100, (now - sunrise) / daylightSeconds * 100)) : 0;
  const code = current.weather_code;
  const icon = weatherCodeToIcon(code).replace(/d$/, current.is_day === 0 ? "n" : "d");
  const condition = weatherCondition(code);
  return {
    city: "Current location", lat, lon, icon,
    temp: Math.round(temp),
    feelsLike: Math.round(current.apparent_temperature ?? temp),
    high: Math.round(data.daily?.temperature_2m_max?.[0] ?? temp),
    low: Math.round(data.daily?.temperature_2m_min?.[0] ?? temp),
    humidity: current.relative_humidity_2m ?? 0,
    windSpeed: Math.round(current.wind_speed_10m ?? 0),
    windDirection: current.wind_direction_10m ?? 0,
    precipitation24h: current.precipitation ?? 0,
    condition, description: condition,
    sunrise, sunset,
    dayLength: `${Math.floor(daylightSeconds / 3600)}h ${Math.floor((daylightSeconds % 3600) / 60)}m`,
    daylightProgress, lastUpdated: new Date().toISOString(),
  };
}
