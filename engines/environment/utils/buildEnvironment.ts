import type {
  AirQuality,
  CurrentWeather,
  ForecastData,
  WeatherData,
  WeatherAlert,
  AstronomyData,
} from "../models/types";

export function mergeEnvironment(
  current: CurrentWeather,
  forecast: ForecastData,
  airQuality: AirQuality,
  weatherAlerts: WeatherAlert[],
  astronomy: AstronomyData
): WeatherData {
  return {
    ...current,

    hourlyForecast: forecast.hourlyForecast,

    dailyForecast: forecast.dailyForecast,
    daylightProgress: current.daylightProgress,
    astronomy,
    airQuality,
    weatherAlerts,
  };
}