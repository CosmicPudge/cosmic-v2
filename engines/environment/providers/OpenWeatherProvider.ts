import type { WeatherData } from "../models/types";

const API_KEY = process.env.OPENWEATHER_API_KEY!;

export async function getOpenWeather(
  lat: number,
  lon: number
): Promise<WeatherData> {

  // Current Weather
  const currentResponse = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`,
    {
      next: {
        revalidate: 300,
      },
    }
  );

  if (!currentResponse.ok) {
    throw new Error("Failed to fetch current weather.");
  }

  const current = await currentResponse.json();

  // Forecast
  const forecastResponse = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`,
    {
      next: {
        revalidate: 300,
      },
    }
  );

  if (!forecastResponse.ok) {
    throw new Error("Failed to fetch forecast.");
  }

  const forecast = await forecastResponse.json();

  const today = forecast.list.slice(0, 8);

  const precipitation24h = today.reduce(
    (total: number, item: any) => {
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
        (item: any) => item.main.temp_max
      )
    )
  );

  const low = Math.round(
    Math.min(
      ...today.map(
        (item: any) => item.main.temp_min
      )
    )
  );

  return {
    city: current.name,

    dailyForecast: [],

    icon: current.weather[0].icon,

    temp: Math.round(current.main.temp),

    feelsLike: Math.round(
      current.main.feels_like
    ),

    high,

    low,

    humidity: current.main.humidity,

    windSpeed: Math.round(
      current.wind.speed
    ),

    windDirection: current.wind.deg,

    precipitation24h: Number(
      precipitation24h.toFixed(2)
    ),

    condition:
      current.weather[0].main,

    description:
      current.weather[0].description,

    sunrise: current.sys.sunrise,

    sunset: current.sys.sunset,

    hourlyForecast: forecast.list
      .slice(0, 8)
      .map((hour: any) => ({
        time: new Date(
          hour.dt * 1000
        ).toLocaleTimeString([], {
          hour: "numeric",
        }),

        temp: Math.round(hour.main.temp),
      })),

    lastUpdated:
      new Date().toISOString(),
  };
}