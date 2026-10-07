import type { CurrentWeather } from "../models/types";
import { fetchWithTimeout } from "@/services/kiosk/fetchWithTimeout";

const API_KEY = process.env.OPENWEATHER_API_KEY;
type ForecastItem = { main: { temp_max: number; temp_min: number }; rain?: { [key: string]: number }; snow?: { [key: string]: number } };

export class WeatherProviderError extends Error {
  constructor(public readonly category: "configuration-error" | "timeout" | "network-error" | "invalid-response", public readonly status?: number) {
    super(category);
    this.name = "WeatherProviderError";
  }
}

type CurrentWeatherPayload = {
  name: string;
  weather: [{ icon: string; main: string; description: string }];
  main: { temp: number; feels_like: number; humidity: number };
  wind: { speed: number; deg?: number };
  sys: { sunrise: number; sunset: number };
};

if (!API_KEY) {
  throw new WeatherProviderError("configuration-error");
}

export async function getOpenWeather(
  lat: number,
  lon: number
): Promise<CurrentWeather & { daylightProgress: number }> {

  // Current Weather
  const currentUrl = new URL("https://api.openweathermap.org/data/2.5/weather");
  currentUrl.search = new URLSearchParams({ lat: String(lat), lon: String(lon), appid: API_KEY ?? "", units: "imperial" }).toString();
  // Current conditions are intentionally fresher than the forecast. The
  // forecast request below remains on the slower five-minute cache window.
  let currentResponse: Response;
  try {
    currentResponse = await fetchWithTimeout(currentUrl, { redirect: "error", next: { revalidate: 45 } });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new WeatherProviderError("timeout");
    throw new WeatherProviderError("network-error");
  }

  if (!currentResponse.ok) {
    throw new WeatherProviderError("invalid-response", currentResponse.status);
  }

  let current: CurrentWeatherPayload;
  try { current = await currentResponse.json() as CurrentWeatherPayload; } catch { throw new WeatherProviderError("invalid-response", currentResponse.status); }
  if (!current || typeof current.name !== "string" || !Array.isArray(current.weather) || !current.weather[0] || typeof current.weather[0].icon !== "string" || typeof current.weather[0].main !== "string" || typeof current.weather[0].description !== "string" || typeof current.main?.temp !== "number" || typeof current.main.feels_like !== "number" || typeof current.main.humidity !== "number" || typeof current.wind?.speed !== "number" || typeof current.sys?.sunrise !== "number" || typeof current.sys?.sunset !== "number") {
    throw new WeatherProviderError("invalid-response", currentResponse.status);
  }

  // Forecast
  const forecastUrl = new URL("https://api.openweathermap.org/data/2.5/forecast");
  forecastUrl.search = new URLSearchParams({ lat: String(lat), lon: String(lon), appid: API_KEY ?? "", units: "imperial" }).toString();
  let today: ForecastItem[] = [];
  try {
    const forecastResponse = await fetchWithTimeout(forecastUrl, { redirect: "error", next: { revalidate: 300 } });
    if (forecastResponse.ok) {
      const forecast = await forecastResponse.json() as { list?: ForecastItem[] };
      today = Array.isArray(forecast.list) ? forecast.list.slice(0, 8) : [];
    }
  } catch {
    // Current conditions remain usable when the slower forecast request fails.
  }

  const precipitation24h = today.reduce(
    (total: number, item: ForecastItem) => {
      return (
        total +
        (item.rain?.["3h"] ?? 0) +
        (item.snow?.["3h"] ?? 0)
      );
    },
    0
  );

  const high = today.length ? Math.round(Math.max(...today.map((item: ForecastItem) => item.main.temp_max))) : Math.round(current.main.temp);
  const low = today.length ? Math.round(Math.min(...today.map((item: ForecastItem) => item.main.temp_min))) : Math.round(current.main.temp);

  const sunrise = current.sys.sunrise;
  const sunset = current.sys.sunset;

  const daylightSeconds = sunset - sunrise;

  const hours = Math.floor(daylightSeconds / 3600);
  const minutes = Math.floor((daylightSeconds % 3600) / 60);

  const dayLength = `${hours}h ${minutes}m`;

  const now = Math.floor(Date.now() / 1000);

  let daylightProgress = 0;

  if (now <= sunrise) {
    daylightProgress = 0;
  } else if (now >= sunset) {
    daylightProgress = 100;
  } else {
    daylightProgress =
      ((now - sunrise) / (sunset - sunrise)) * 100;
  }

  return {
    city: current.name,
    lat,
    lon,

    icon: current.weather[0].icon,

    temp: Math.round(current.main.temp),

    feelsLike: Math.round(current.main.feels_like),

    high,
    low,

    humidity: current.main.humidity,

    windSpeed: Math.round(current.wind.speed),

    windDirection: current.wind.deg ?? 0,

    precipitation24h: Number(
      precipitation24h.toFixed(2)
    ),

    condition: current.weather[0].main,

    description: current.weather[0].description,

    sunrise,
    sunset,

    dayLength,
    daylightProgress,

    lastUpdated: new Date().toISOString(),
  };
}
