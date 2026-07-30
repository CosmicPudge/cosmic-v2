import type {
  CurrentWeather,
  ForecastData,
  AirQuality,
  WeatherData,
} from "./models/types";
import { getWeatherAlerts } from "./providers/NWSProvider";
import { getOpenWeather } from "./providers/OpenWeatherProvider";
import { getOpenMeteo } from "./providers/OpenMeteoProvider";
import { getOpenWeatherAirQuality } from "./providers/OpenWeatherAirQualityProvider";
import { getAstronomy } from "./providers/AstronomyProvider";
import { mergeEnvironment } from "./utils/buildEnvironment";

export async function getEnvironment(
  lat: number,
  lon: number
): Promise<WeatherData> {
  const [
    currentResult,
    forecastResult,
    airQualityResult,
    alertsResult,
    astronomyResult,
  ] = await Promise.allSettled([
    getOpenWeather(lat, lon),
    getOpenMeteo(lat, lon),
    getOpenWeatherAirQuality(lat, lon),
    getWeatherAlerts(lat, lon),
    getAstronomy(),
  ]);

  // Current weather is required
  if (currentResult.status !== "fulfilled") {
    throw currentResult.reason;
  }

  const current: CurrentWeather = currentResult.value;

  const forecast: ForecastData =
    forecastResult.status === "fulfilled"
      ? forecastResult.value
      : {
        hourlyForecast: [],
        dailyForecast: [],
        uvIndex: 0,
      };

  const airQuality: AirQuality =
    airQualityResult.status === "fulfilled"
      ? airQualityResult.value
      : {
        aqi: 0,
        pm25: 0,
        pm10: 0,
        ozone: 0,
        no2: 0,
        co: 0,
      };

  const astronomy =
    astronomyResult.status === "fulfilled"
      ? astronomyResult.value
      : {
        moonPhase: 0,
        moonPhaseName: "Unknown",
        illumination: 0,
        moonrise: 0,
        moonset: 0,
        nextFullMoon: "",
        nextNewMoon: "",
      };


  const weatherAlerts =
    alertsResult.status === "fulfilled"
      ? alertsResult.value
      : [];

  return mergeEnvironment(
    current,
    forecast,
    airQuality,
    weatherAlerts,
    astronomy
);

}
