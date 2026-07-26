import type { WeatherCondition } from "./types";

export default function mapWeatherCondition(
  condition: string
): WeatherCondition {
  const value = condition.toLowerCase();

  // Thunder
  if (
    value.includes("thunder") ||
    value.includes("lightning")
  ) {
    return "thunderstorm";
  }

  // Snow
  if (
    value.includes("snow") ||
    value.includes("blizzard")
  ) {
    return "snow";
  }

  // Rain / Drizzle
  if (
    value.includes("rain") ||
    value.includes("drizzle") ||
    value.includes("shower")
  ) {
    return "rain";
  }

  // Fog
  if (
    value.includes("fog") ||
    value.includes("mist") ||
    value.includes("haze")
  ) {
    return "fog";
  }

  // Wind
  if (
    value.includes("wind") ||
    value.includes("breezy")
  ) {
    return "wind";
  }

  // Clouds
  if (
    value.includes("overcast")
  ) {
    return "cloudy";
  }

  if (
    value.includes("broken") ||
    value.includes("scattered") ||
    value.includes("few")
  ) {
    return "partly-cloudy";
  }

  if (
    value.includes("cloud")
  ) {
    return "cloudy";
  }

  // Clear
  return "clear";
}