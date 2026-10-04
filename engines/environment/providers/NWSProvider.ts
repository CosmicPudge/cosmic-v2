export async function getWeatherAlerts(
  lat: number,
  lon: number
) {
  const response = await fetchWithTimeout(
    `https://api.weather.gov/alerts/active?point=${lat},${lon}`,
    {
      next: { revalidate: 120 },
      headers: {
        "User-Agent": "Cosmic Weather",
        Accept: "application/geo+json",
      },
    }
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();

  return data.features;
}
import { fetchWithTimeout } from "@/services/kiosk/fetchWithTimeout";
