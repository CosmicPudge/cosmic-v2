import type { ForecastData } from "../models/types";
import { weatherCodeToIcon } from "../utils/weatherCodeToIcon";

export async function getOpenMeteo(
  lat: number,
  lon: number
): Promise<ForecastData> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({ latitude: String(lat), longitude: String(lon), hourly: "temperature_2m,relative_humidity_2m,cloud_cover,precipitation_probability,wind_speed_10m,weather_code,uv_index", daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max", temperature_unit: "fahrenheit", wind_speed_unit: "mph", timezone: "auto" }).toString();
  const response = await fetch(url, { redirect: "error", cache: "no-store" });

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
