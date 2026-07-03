import type { WeatherData } from "../models/types";

export function mergeEnvironment(
  current: WeatherData,
  forecast: {
    hourlyForecast: WeatherData["hourlyForecast"];
    dailyForecast: WeatherData["dailyForecast"];
  }
): WeatherData {
  return {
    ...current,

    hourlyForecast: forecast.hourlyForecast,

    dailyForecast: forecast.dailyForecast,
  };
}