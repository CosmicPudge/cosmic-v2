import type { CurrentWeather, ForecastData } from "../models/types";
import { weatherCodeToIcon } from "../utils/weatherCodeToIcon";
import { fetchWithTimeout } from "@/services/kiosk/fetchWithTimeout";

export async function getOpenMeteo(
  lat: number,
  lon: number
): Promise<ForecastData> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({ latitude: String(lat), longitude: String(lon), hourly: "temperature_2m,relative_humidity_2m,cloud_cover,precipitation_probability,wind_speed_10m,weather_code,uv_index", daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max", temperature_unit: "fahrenheit", wind_speed_unit: "mph", timezone: "auto" }).toString();
  const response = await fetchWithTimeout(url, { redirect: "error", next: { revalidate: 300 } });

  if (!response.ok) {
    throw new Error("Open-Meteo request failed.");
  }

  const data = await response.json();

  const now = new Date();

// Round down to the current hour
now.setMinutes(0, 0, 0);

const currentIndex = data.hourly.time.findIndex(
  (time: string) => new Date(time).getTime() >= now.getTime()
);

const startIndex = Math.max(currentIndex, 0);

const hourlyForecast = data.hourly.time
  .slice(startIndex, startIndex + 24)
  .map((time: string, index: number) => ({
    time:
      index === 0
        ? "Now"
        : new Date(time).toLocaleTimeString([], {
            hour: "numeric",
          }),

    temp: Math.round(
      data.hourly.temperature_2m[startIndex + index]
    ),

    icon: weatherCodeToIcon(
      data.hourly.weather_code[startIndex + index]
    ),

    precipitationChance:
      data.hourly.precipitation_probability[
        startIndex + index
      ],

    windSpeed: Math.round(
      data.hourly.wind_speed_10m[startIndex + index]
    ),

    humidity:
      data.hourly.relative_humidity_2m[
        startIndex + index
      ],

    cloudCover:
      data.hourly.cloud_cover[startIndex + index],
  }));

  const dailyForecast = data.daily.time
  .slice(0, 7)
  .map((day: string, index: number) => {
    const [year, month, date] = day.split("-").map(Number);

    const localDate = new Date(
      year,
      month - 1,
      date
    );

    // Make the first two days friendlier
    let dayLabel = localDate.toLocaleDateString([], {
      weekday: "short",
    });

    if (index === 0) {
      dayLabel = "Today";
    } else if (index === 1) {
      dayLabel = "Tomorrow";
    }

    return {
      day: dayLabel,

      date: localDate.toLocaleDateString([], {
        month: "short",
        day: "numeric",
      }),

      high: Math.round(
        data.daily.temperature_2m_max[index]
      ),

      low: Math.round(
        data.daily.temperature_2m_min[index]
      ),

      icon: weatherCodeToIcon(
        data.daily.weather_code[index]
      ),

      precipitationChance:
        data.daily.precipitation_probability_max[index],
    };
  });

  return {
    hourlyForecast,
    dailyForecast,
    uvIndex: Math.round(data.hourly.uv_index?.[startIndex] ?? 0),
  };
}


function openMeteoCondition(code: number) {
  if (code === 0) return { condition: "Clear", description: "clear sky" };
  if ([1, 2].includes(code)) return { condition: "Partly Cloudy", description: "partly cloudy" };
  if (code === 3) return { condition: "Cloudy", description: "overcast" };
  if ([45, 48].includes(code)) return { condition: "Fog", description: "foggy" };
  if ([51, 53, 55, 56, 57].includes(code)) return { condition: "Drizzle", description: "drizzle" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { condition: "Rain", description: "rain" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { condition: "Snow", description: "snow" };
  if ([95, 96, 99].includes(code)) return { condition: "Thunderstorm", description: "thunderstorms" };
  return { condition: "Cloudy", description: "cloudy" };
}

export async function getOpenMeteoCurrent(
  lat: number,
  lon: number
): Promise<CurrentWeather> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day",
    daily: "temperature_2m_max,temperature_2m_min,sunrise,sunset",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    timezone: "auto",
    forecast_days: "1",
  }).toString();

  const response = await fetchWithTimeout(url, { redirect: "error", next: { revalidate: 45 } });
  if (!response.ok) throw new Error("Open-Meteo current weather request failed.");

  const data = await response.json() as {
    timezone?: string;
    current?: {
      temperature_2m?: number;
      apparent_temperature?: number;
      relative_humidity_2m?: number;
      precipitation?: number;
      weather_code?: number;
      wind_speed_10m?: number;
      wind_direction_10m?: number;
      is_day?: number;
      time?: string;
    };
    daily?: {
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
      sunrise?: string[];
      sunset?: string[];
    };
  };

  const current = data.current;
  if (!current || typeof current.temperature_2m !== "number" || typeof current.weather_code !== "number") {
    throw new Error("Open-Meteo current weather response was invalid.");
  }

  const sunriseMs = Date.parse(data.daily?.sunrise?.[0] ?? "");
  const sunsetMs = Date.parse(data.daily?.sunset?.[0] ?? "");
  const sunrise = Number.isFinite(sunriseMs) ? Math.floor(sunriseMs / 1000) : 0;
  const sunset = Number.isFinite(sunsetMs) ? Math.floor(sunsetMs / 1000) : 0;
  const now = Date.now() / 1000;
  const daylightProgress = sunrise && sunset
    ? now <= sunrise ? 0 : now >= sunset ? 100 : ((now - sunrise) / (sunset - sunrise)) * 100
    : current.is_day ? 50 : 100;
  const daylightSeconds = sunrise && sunset ? Math.max(0, sunset - sunrise) : 0;
  const hours = Math.floor(daylightSeconds / 3600);
  const minutes = Math.floor((daylightSeconds % 3600) / 60);
  const condition = openMeteoCondition(current.weather_code);

  return {
    city: "Current location",
    lat,
    lon,
    icon: weatherCodeToIcon(current.weather_code),
    temp: Math.round(current.temperature_2m),
    feelsLike: Math.round(current.apparent_temperature ?? current.temperature_2m),
    high: Math.round(data.daily?.temperature_2m_max?.[0] ?? current.temperature_2m),
    low: Math.round(data.daily?.temperature_2m_min?.[0] ?? current.temperature_2m),
    humidity: Math.round(current.relative_humidity_2m ?? 0),
    windSpeed: Math.round(current.wind_speed_10m ?? 0),
    windDirection: Math.round(current.wind_direction_10m ?? 0),
    precipitation24h: Number(current.precipitation ?? 0),
    condition: condition.condition,
    description: condition.description,
    sunrise,
    sunset,
    daylightProgress,
    dayLength: daylightSeconds ? `${hours}h ${minutes}m` : "",
    lastUpdated: new Date().toISOString(),
  };
}
