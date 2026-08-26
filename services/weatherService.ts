import type { WeatherData } from "@/engines/environment";
import { kioskApiUrl } from "@/services/kioskRequest";

function weatherLog(message: string) {
  if (process.env.NODE_ENV !== "production") console.info(`[weather] ${message}`);
}

export async function getWeather(
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<WeatherData> {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
  weatherLog(`request-start latPresent=${Number.isFinite(lat)} lonPresent=${Number.isFinite(lon)}`);
  const response = await fetch(
    kioskApiUrl(`/api/weather?${params.toString()}`),
    { credentials: "include", cache: "no-store", signal: signal ?? AbortSignal.timeout(15_000) },
  );
  weatherLog(`response-status=${response.status}`);

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: unknown } | null;
    const message = typeof body?.error === "string" ? body.error.slice(0, 120) : `HTTP ${response.status}`;
    weatherLog(`request-error=${message}`);
    throw new Error(message);
  }

  const body = await response.json() as Partial<WeatherData>;
  const valid = typeof body.city === "string" && typeof body.condition === "string" && typeof body.temp === "number";
  if (!valid) {
    weatherLog("request-error=invalid response shape");
    throw new Error("Weather response was invalid.");
  }
  weatherLog("request-success");
  return body as WeatherData;
}
