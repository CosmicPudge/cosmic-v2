import type { WeatherData } from "@/engines/environment";

export default function getGreeting(
  weather: WeatherData
) {
  const hour = new Date().getHours();

  const condition =
    weather.condition.toLowerCase();

  if (condition.includes("snow")) {
    return "Snow Today";
  }

  if (condition.includes("thunder")) {
    return "Storms Moving Through";
  }

  if (
    condition.includes("rain") ||
    condition.includes("drizzle")
  ) {
    return "Rain Expected Today";
  }

  if (hour < 12) {
    return "Good Morning";
  }

  if (hour < 18) {
    return "Good Afternoon";
  }

  return "Good Evening";
}