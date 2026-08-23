import type { CurrentWeather } from "../models/types";

const API_KEY = process.env.OPENWEATHER_API_KEY;
type ForecastItem = { main: { temp_max: number; temp_min: number }; rain?: { [key: string]: number }; snow?: { [key: string]: number } };

if (!API_KEY) {
  throw new Error(
    "OPENWEATHER_API_KEY is not configured."
  );
}

export async function getOpenWeather(
  lat: number,
  lon: number
): Promise<CurrentWeather & { daylightProgress: number }> {

  // Current Weather
  const currentUrl = new URL("https://api.openweathermap.org/data/2.5/weather");
  currentUrl.search = new URLSearchParams({ lat: String(lat), lon: String(lon), appid: API_KEY ?? "", units: "imperial" }).toString();
  const currentResponse = await fetch(currentUrl, { redirect: "error", next: { revalidate: 300 } });

  if (!currentResponse.ok) {
    throw new Error("Failed to fetch current weather.");
  }

  const current = await currentResponse.json();

  // Forecast
  const forecastUrl = new URL("https://api.openweathermap.org/data/2.5/forecast");
  forecastUrl.search = new URLSearchParams({ lat: String(lat), lon: String(lon), appid: API_KEY ?? "", units: "imperial" }).toString();
  const forecastResponse = await fetch(forecastUrl, { redirect: "error", next: { revalidate: 300 } });

  if (!forecastResponse.ok) {
    throw new Error("Failed to fetch forecast.");
  }

  const forecast = await forecastResponse.json() as { list: ForecastItem[] };

  const today = forecast.list.slice(0, 8);

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

  const high = Math.round(
    Math.max(
      ...today.map(
      (item: ForecastItem) => item.main.temp_max
      )
    )
  );

  const low = Math.round(
    Math.min(
      ...today.map(
        (item: ForecastItem) => item.main.temp_min
      )
    )
  );

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

    windDirection: current.wind.deg,

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
