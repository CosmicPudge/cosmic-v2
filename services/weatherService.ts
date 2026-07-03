import type { WeatherData } from "@/engines/environment";

export async function getWeather(
  lat: number,
  lon: number
): Promise<WeatherData> {
  const response = await fetch(
    `/api/weather?lat=${lat}&lon=${lon}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch weather.");
  }

  return response.json();
}