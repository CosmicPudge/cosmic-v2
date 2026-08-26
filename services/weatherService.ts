import type { WeatherData } from "@/engines/environment";
import { kioskApiUrl } from "@/services/kioskRequest";

export async function getWeather(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<WeatherData> {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
  const response = await fetch(
    kioskApiUrl(`/api/weather?${params.toString()}`),
    { credentials: "include", cache: "no-store", signal: signal ?? AbortSignal.timeout(15_000) },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch weather.");
  }

  return response.json();
}
