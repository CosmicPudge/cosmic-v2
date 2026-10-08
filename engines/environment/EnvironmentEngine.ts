import type {
  CurrentWeather,
  ForecastData,
  AirQuality,
  WeatherData,
} from "./models/types";
import { getWeatherAlerts } from "./providers/NWSProvider";
import { getOpenWeather } from "./providers/OpenWeatherProvider";
import { getOpenMeteo, getOpenMeteoCurrent } from "./providers/OpenMeteoProvider";
import { getOpenWeatherAirQuality } from "./providers/OpenWeatherAirQualityProvider";
import { getAstronomy } from "./providers/AstronomyProvider";
import { mergeEnvironment } from "./utils/buildEnvironment";
import { recordCacheMetric } from "@/services/observability/metrics";

const ENVIRONMENT_CACHE_TTL_MS = 45_000;
const environmentCache = new Map<string, { expiresAt: number; value: WeatherData }>();
const environmentRequests = new Map<string, Promise<WeatherData>>();
const MAX_ENVIRONMENT_CACHE_ENTRIES = 64;

function cacheKey(lat: number, lon: number) {
  return `${lat.toFixed(2)}:${lon.toFixed(2)}`;
}

function trimCache() {
  if (environmentCache.size < MAX_ENVIRONMENT_CACHE_ENTRIES) return;
  const oldest = [...environmentCache.entries()].sort((left, right) => left[1].expiresAt - right[1].expiresAt)[0];
  if (oldest) { environmentCache.delete(oldest[0]); recordCacheMetric({ cache: "environment.weather", event: "evictions" }); }
}

export async function getEnvironment(
  lat: number,
  lon: number
): Promise<WeatherData> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new Error("Invalid weather coordinates.");
  }
  const key = cacheKey(lat, lon);
  const cached = environmentCache.get(key);
  if (cached && cached.expiresAt > Date.now()) { recordCacheMetric({ cache: "environment.weather", event: "hits" }); return cached.value; }
  recordCacheMetric({ cache: "environment.weather", event: "misses" });
  const pending = environmentRequests.get(key);
  if (pending) { recordCacheMetric({ cache: "environment.weather", event: "coalesced" }); return pending; }

  const request = loadEnvironment(lat, lon).then((weather) => {
    recordCacheMetric({ cache: "environment.weather", event: "refreshes" });
    trimCache();
    environmentCache.set(key, { value: weather, expiresAt: Date.now() + ENVIRONMENT_CACHE_TTL_MS });
    return weather;
  }).catch((error) => {
    recordCacheMetric({ cache: "environment.weather", event: "failures" });
    throw error;
  }).finally(() => {
    environmentRequests.delete(key);
  });
  environmentRequests.set(key, request);
  return request;
}

async function loadEnvironment(lat: number, lon: number): Promise<WeatherData> {
  const [
    currentResult,
    forecastResult,
    airQualityResult,
    alertsResult,
    astronomyResult,
  ] = await Promise.allSettled([
    getOpenWeather(lat, lon).catch(() => getOpenMeteoCurrent(lat, lon)),
    getOpenMeteo(lat, lon),
    getOpenWeatherAirQuality(lat, lon),
    getWeatherAlerts(lat, lon),
    getAstronomy(lat, lon),
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
