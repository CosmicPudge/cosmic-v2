import type { WeatherData } from "./models/types";

import { getOpenWeather } from "./providers/OpenWeatherProvider";
import { getOpenMeteo } from "./providers/OpenMeteoProvider";

import { mergeEnvironment } from "./utils/mergeEnvironment";

export async function getEnvironment(
  lat: number,
  lon: number
): Promise<WeatherData> {
  const current = await getOpenWeather(lat, lon);

  let forecast: {
    hourlyForecast: WeatherData["hourlyForecast"];
    dailyForecast: WeatherData["dailyForecast"];
  } = {
    hourlyForecast: [],
    dailyForecast: [],
  };

  try {
    forecast = await getOpenMeteo(lat, lon);
  } catch (error) {
    console.warn("Open-Meteo unavailable:", error);
  }

  return mergeEnvironment(current, forecast);
}